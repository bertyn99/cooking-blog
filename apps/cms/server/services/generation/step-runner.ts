import type {
  AssembleDraftInput,
  GenerationStepKey,
  GenerationTargetType,
} from '../../db/queries/content-generation'
import type { LlmArticleExtract, LlmRecipeExtract } from '../../utils/validations/llm-extract'
import { llmExtractSchemaForTarget } from '../../utils/validations/llm-extract'
import { runLlmExtract } from './llm-extract'
import { gatherKeywordBrief } from './keyword-research'
import type { GenerationArtifactStore } from './artifact-storage'
import { discoverCandidatesFromMarkdown } from './discover-candidates'

export interface SourcePack {
  /** How the source was provided. product_page / youtube come later. */
  sourceKind?: 'paste' | 'article' | 'ebook'
  title?: string
  locale?: string
  markdown?: string
  sourceUrl?: string
  /** Optional R2 key for ebook binary (text still mirrored in markdown/chunks). */
  ebookObjectKey?: string
}

export interface AssembleArtifact extends AssembleDraftInput {
  linkedArticleId?: number
  linkedRecipeId?: number
}

export interface GenerationRunContext {
  id: string
  targetType: GenerationTargetType
  articleId?: number | null
  recipeId?: number | null
  artifactPrefix: string
  requestedByUserId?: number | null
}

export interface GenerationStepDeps {
  /** Workers AI binding when running outside H3 (Workflows). */
  ai?: Ai
  /** Cloudflare AI Gateway id (see `CMS_AI_GATEWAY_ID`). */
  gatewayId?: string
}

export interface GenerationStepResult {
  artifactKey: string
  linkedArticleId?: number
  linkedRecipeId?: number
  /** Present when the service must persist the draft via the query layer. */
  pendingAssemble?: AssembleDraftInput
}

function defaultTitleFromSource(source: SourcePack | null, targetType: GenerationTargetType) {
  if (source?.title?.trim()) {
    return source.title.trim()
  }
  return targetType === 'recipe' ? 'Nouvelle recette (IA)' : 'Nouvel article (IA)'
}

function assembleArtifactKey(artifactPrefix: string) {
  const normalized = artifactPrefix.replace(/^\/+|\/+$/g, '')
  return `generation/${normalized}/assemble.json`
}

export function buildAssembleDraft(
  source: SourcePack | null,
  extract: (LlmArticleExtract | LlmRecipeExtract) | null,
  run: GenerationRunContext,
): AssembleDraftInput {
  if (run.targetType === 'article' && extract && 'content' in extract) {
    return {
      title: extract.title,
      content: extract.content,
      excerpt: extract.excerpt ?? null,
      locale: source?.locale ?? 'fr',
    }
  }

  if (run.targetType === 'recipe' && extract && !('content' in extract)) {
    return {
      title: extract.title,
      content: extract.intro ?? null,
      excerpt: extract.excerpt ?? null,
      locale: source?.locale ?? 'fr',
      recipeFields: {
        prepTimeMinutes: extract.prepTimeMinutes,
        cookTimeMinutes: extract.cookTimeMinutes,
        servings: extract.servings,
        difficulty: extract.difficulty,
        ingredients: extract.ingredients,
        steps: extract.steps,
        nutrition: extract.nutrition,
      },
    }
  }

  return {
    title: extract?.title ?? defaultTitleFromSource(source, run.targetType),
    content: source?.markdown ?? null,
    locale: source?.locale ?? 'fr',
  }
}

export async function executeGenerationStep(
  artifacts: GenerationArtifactStore,
  run: GenerationRunContext,
  stepKey: GenerationStepKey,
  deps: GenerationStepDeps = {},
  options?: {
    linkedIds?: { articleId?: number | null, recipeId?: number | null }
  },
): Promise<GenerationStepResult> {
  const source = await artifacts.getJson<SourcePack>(run.artifactPrefix, 'source-pack')

  switch (stepKey) {
    case 'normalize': {
      const payload = {
        normalizedAt: new Date().toISOString(),
        sourceUrl: source?.sourceUrl ?? null,
        locale: source?.locale ?? 'fr',
        sourceKind: source?.sourceKind ?? 'paste',
      }
      const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, payload)
      return { artifactKey }
    }
    case 'classify': {
      const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, {
        contentKind: run.targetType,
        classifiedAt: new Date().toISOString(),
      })
      return { artifactKey }
    }
    case 'keyword_research': {
      const normalize = await artifacts.getJson<{ locale?: string }>(run.artifactPrefix, 'normalize')
      const brief = await gatherKeywordBrief({
        targetType: run.targetType,
        locale: normalize?.locale ?? source?.locale ?? 'fr',
        source,
      })
      const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, brief)
      return { artifactKey }
    }
    case 'extract': {
      const normalize = await artifacts.getJson<{ locale?: string }>(run.artifactPrefix, 'normalize')
      const keywordBrief = await artifacts.getJson(run.artifactPrefix, 'keyword_research')
      const extracted = await runLlmExtract({
        targetType: run.targetType,
        source,
        locale: normalize?.locale ?? source?.locale ?? 'fr',
        keywordBrief,
        ai: deps.ai,
        gatewayId: deps.gatewayId,
      })
      const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, extracted)
      return { artifactKey }
    }
    case 'assemble': {
      const existingAssemble = await artifacts.getJson<AssembleArtifact>(
        run.artifactPrefix,
        'assemble',
      )
      if (existingAssemble?.linkedArticleId || existingAssemble?.linkedRecipeId) {
        return {
          artifactKey: assembleArtifactKey(run.artifactPrefix),
          linkedArticleId: existingAssemble.linkedArticleId,
          linkedRecipeId: existingAssemble.linkedRecipeId,
        }
      }

      const linkedIds = options?.linkedIds
      if (linkedIds?.articleId || linkedIds?.recipeId) {
        const extract = await artifacts.getJson<LlmArticleExtract | LlmRecipeExtract>(
          run.artifactPrefix,
          'extract',
        )
        const assemble: AssembleArtifact = {
          ...buildAssembleDraft(source, extract, run),
          linkedArticleId: linkedIds.articleId ?? undefined,
          linkedRecipeId: linkedIds.recipeId ?? undefined,
        }
        const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, assemble)
        return {
          artifactKey,
          linkedArticleId: linkedIds.articleId ?? undefined,
          linkedRecipeId: linkedIds.recipeId ?? undefined,
        }
      }

      const extract = await artifacts.getJson<LlmArticleExtract | LlmRecipeExtract>(
        run.artifactPrefix,
        'extract',
      )
      return {
        artifactKey: '',
        pendingAssemble: buildAssembleDraft(source, extract, run),
      }
    }
    case 'validate': {
      const extract = await artifacts.getJson(run.artifactPrefix, 'extract')
      if (!extract) {
        throw new Error('Missing extract artifact')
      }
      const schema = llmExtractSchemaForTarget(run.targetType)
      const parsed = schema.safeParse(extract)
      if (!parsed.success) {
        throw new Error(`Extract validation failed: ${parsed.error.message}`)
      }
      const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, {
        valid: true,
        validatedAt: new Date().toISOString(),
        targetType: run.targetType,
      })
      return { artifactKey }
    }
    case 'generate_cover': {
      const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, {
        skipped: true,
        reason: 'Workers AI cover not wired yet',
      })
      return { artifactKey }
    }
    case 'discover': {
      const preferred = run.targetType
      const artifact = discoverCandidatesFromMarkdown({
        markdown: source?.markdown ?? '',
        preferredTargetType: preferred,
        titleHint: source?.title ?? null,
      })
      const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, artifact)
      return { artifactKey }
    }
    case 'revise_1':
    case 'revise_2': {
      const round = stepKey === 'revise_1' ? 1 : 2
      const notes = await artifacts.getJson<{
        reviewNote?: string
        focusSteps?: string[] | null
        round?: number
      }>(run.artifactPrefix, `review-notes-${round}`)
      if (!notes?.reviewNote?.trim()) {
        throw new Error(`Missing review notes for ${stepKey}`)
      }

      const normalize = await artifacts.getJson<{ locale?: string }>(run.artifactPrefix, 'normalize')
      const keywordBrief = await artifacts.getJson(run.artifactPrefix, 'keyword_research')
      const extracted = await runLlmExtract({
        targetType: run.targetType,
        source,
        locale: normalize?.locale ?? source?.locale ?? 'fr',
        keywordBrief,
        revisionBrief: {
          round,
          reviewNote: notes.reviewNote,
          focusSteps: notes.focusSteps ?? null,
        },
        ai: deps.ai,
        gatewayId: deps.gatewayId,
      })
      await artifacts.putJson(run.artifactPrefix, 'extract', extracted)
      const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, {
        revisedAt: new Date().toISOString(),
        round,
        reviewNote: notes.reviewNote,
        extract: extracted,
      })

      const schema = llmExtractSchemaForTarget(run.targetType)
      const parsed = schema.safeParse(extracted)
      if (!parsed.success) {
        throw new Error(`Revised extract validation failed: ${parsed.error.message}`)
      }

      return {
        artifactKey,
        pendingAssemble: buildAssembleDraft(source, extracted, run),
      }
    }
    default: {
      const _exhaustive: never = stepKey
      return _exhaustive
    }
  }
}
