import type { H3Event } from 'h3'
import { generateText, Output } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'
import type { GenerationTargetType } from '../../db/queries/content-generation'
import { getCloudflareEnv } from '../../utils/cloudflare-env'
import type { LlmArticleExtract, LlmRecipeExtract } from '../../utils/validations/llm-extract'
import {
  llmArticleExtractSchema,
  llmRecipeExtractSchema,
} from '../../utils/validations/llm-extract'
import { extractFromMarkdownHeuristic } from './llm-extract-heuristic'

/**
 * Extract source today: R2 SourcePack JSON
 * `{ title?, locale?, markdown?, sourceUrl? }` — markdown is required.
 * Vision is unused until SourcePack gains images/PDFs; Gemma 4 still wins on
 * FR multilingual + structured extract, and keeps vision for that upgrade.
 *
 * `@cf/google/gemma-4-26b-a4b-it` — Gemma 4 (Gemini 3 research), 35+ langs /
 * pretrained 140+, vision, 256k ctx, $0.10/$0.30 per M tokens.
 * @see https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/
 */
const WORKERS_AI_MODEL = '@cf/google/gemma-4-26b-a4b-it' as const

export interface LlmExtractRequest {
  targetType: GenerationTargetType
  locale: string
  title?: string
  markdown: string
  sourceUrl?: string
}

export interface LlmClient {
  readonly provider: 'workers-ai' | 'heuristic'
  extract(request: LlmExtractRequest): Promise<LlmArticleExtract | LlmRecipeExtract>
}

function articleSystemPrompt(locale: string) {
  return [
    'You extract structured article fields from source markdown for a French cooking blog.',
    `Write in locale "${locale}".`,
    'Populate title, excerpt, content, and evidenceChunks.',
    'evidenceChunks must cite short verbatim spans from the source (array of { text, sourceSpan? }).',
    'Do not invent slug, status, category, cover, or publish fields.',
  ].join(' ')
}

function recipeSystemPrompt(locale: string) {
  return [
    'You extract structured recipe fields from source markdown for a French cooking blog.',
    `Write in locale "${locale}".`,
    'Populate title, excerpt, intro, prepTimeMinutes, cookTimeMinutes, servings, difficulty, ingredients, steps, nutrition, and evidenceChunks.',
    'ingredients: array of { name, qty?, unit? } where unit is one of: none, g, mg, kg, l, ml, cuillere_soupe, cuillere_cafe, tasse.',
    'steps: array of { title?, instruction }.',
    'difficulty: easy | medium | hard.',
    'evidenceChunks must cite short verbatim spans from the source.',
    'Do not invent slug, status, category, cover, or publish fields.',
  ].join(' ')
}

function buildUserPrompt(request: LlmExtractRequest) {
  return [
    request.title ? `Title hint: ${request.title}` : null,
    request.sourceUrl ? `Source URL: ${request.sourceUrl}` : null,
    '---',
    request.markdown,
  ].filter(Boolean).join('\n')
}

export function createWorkersAiClient(ai: Ai): LlmClient {
  const workersai = createWorkersAI({ binding: ai })
  const model = workersai(WORKERS_AI_MODEL)

  return {
    provider: 'workers-ai',
    async extract(request) {
      const isArticle = request.targetType === 'article'
      const schema = isArticle ? llmArticleExtractSchema : llmRecipeExtractSchema

      const { output } = await generateText({
        model,
        system: isArticle
          ? articleSystemPrompt(request.locale)
          : recipeSystemPrompt(request.locale),
        prompt: buildUserPrompt(request),
        maxOutputTokens: 4096,
        temperature: 0.2,
        output: Output.object({
          schema,
          name: isArticle ? 'article_extract' : 'recipe_extract',
          description: isArticle
            ? 'Structured article extract with evidence chunks'
            : 'Structured recipe extract with evidence chunks',
        }),
      })

      if (!output) {
        throw new Error('LLM extract produced no structured output')
      }

      return output
    },
  }
}

export function createHeuristicLlmClient(): LlmClient {
  return {
    provider: 'heuristic',
    extract(request) {
      return Promise.resolve(extractFromMarkdownHeuristic(request))
    },
  }
}

export function createLlmClient(event?: H3Event): LlmClient {
  const env = getCloudflareEnv(event)
  if (env?.AI) {
    return createWorkersAiClient(env.AI)
  }
  return createHeuristicLlmClient()
}

export function useLlmClient(event?: H3Event): LlmClient {
  return createLlmClient(event)
}
