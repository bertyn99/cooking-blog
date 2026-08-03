import type { GenerationTargetType } from '../../db/queries/content-generation'
import type { LlmArticleExtract, LlmEvidenceChunk, LlmRecipeExtract } from '../../utils/validations/llm-extract'
import type { LlmExtractRequest } from './llm-client'

const INGREDIENT_HEADERS = /^(ingrédients|ingredients)\b/i
const STEP_HEADERS = /^(préparation|preparation|instructions|étapes|etapes)\b/i

function firstHeadingTitle(markdown: string): string | undefined {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim()
}

function firstParagraphExcerpt(markdown: string, max = 280): string | null {
  const blocks = markdown
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(block => block && !block.startsWith('#'))

  const paragraph = blocks[0]
  if (!paragraph) {
    return null
  }
  return paragraph.length > max ? `${paragraph.slice(0, max - 1)}…` : paragraph
}

function chunkEvidence(markdown: string, chunkSize = 900): LlmEvidenceChunk[] {
  const chunks: LlmEvidenceChunk[] = []
  let offset = 0
  let index = 0

  while (offset < markdown.length) {
    const text = markdown.slice(offset, offset + chunkSize).trim()
    if (text) {
      chunks.push({
        text,
        sourceSpan: `chars:${offset}-${offset + text.length}`,
      })
    }
    offset += chunkSize
    index += 1
    if (index > 12) {
      break
    }
  }

  return chunks.length > 0 ? chunks : [{ text: markdown.slice(0, 2000) }]
}

function splitSections(markdown: string) {
  const lines = markdown.split('\n')
  const sections: Array<{ title: string, body: string[] }> = []
  let current: { title: string, body: string[] } | null = null

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.+)$/)
    if (heading) {
      if (current) {
        sections.push(current)
      }
      current = { title: heading[1]!.trim(), body: [] }
      continue
    }
    if (current) {
      current.body.push(line)
    }
  }
  if (current) {
    sections.push(current)
  }
  return sections
}

function parseListItems(lines: string[]) {
  return lines
    .map(line => line.trim())
    .filter(line => /^[-*•]|\d+[.)]/.test(line))
    .map((line) => {
      const cleaned = line.replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, '').trim()
      const qtyMatch = cleaned.match(/^([\d.,]+)\s*([a-zA-Zéèêàùûôîäëïöüç]+)?\s+(.+)$/)
      if (qtyMatch) {
        const qty = Number.parseFloat(qtyMatch[1]!.replace(',', '.'))
        return {
          name: qtyMatch[3]!.trim(),
          qty: Number.isFinite(qty) ? qty : undefined,
          unit: qtyMatch[2]?.toLowerCase(),
        }
      }
      return { name: cleaned }
    })
    .filter(item => item.name.length > 0)
}

function parseSteps(lines: string[]) {
  return lines
    .map(line => line.trim())
    .filter(line => /^[-*•]|\d+[.)]/.test(line))
    .map((line, index) => ({
      instruction: line.replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, '').trim(),
      sortOrder: index,
    }))
    .filter(step => step.instruction.length > 0)
}

function heuristicRecipeExtract(request: LlmExtractRequest): LlmRecipeExtract {
  const title = request.title?.trim() || firstHeadingTitle(request.markdown) || 'Nouvelle recette'
  const sections = splitSections(request.markdown)
  const ingredientSection = sections.find(section => INGREDIENT_HEADERS.test(section.title))
  const stepSection = sections.find(section => STEP_HEADERS.test(section.title))
  const introSection = sections.find(section =>
  !INGREDIENT_HEADERS.test(section.title) && !STEP_HEADERS.test(section.title),
  )

  return {
    title,
    excerpt: firstParagraphExcerpt(request.markdown),
    intro: introSection?.body.join('\n').trim() || request.markdown.slice(0, 1200),
    ingredients: ingredientSection ? parseListItems(ingredientSection.body) : undefined,
    steps: stepSection ? parseSteps(stepSection.body) : undefined,
    evidenceChunks: chunkEvidence(request.markdown),
  }
}

function heuristicArticleExtract(request: LlmExtractRequest): LlmArticleExtract {
  const title = request.title?.trim() || firstHeadingTitle(request.markdown) || 'Nouvel article'
  return {
    title,
    excerpt: firstParagraphExcerpt(request.markdown),
    content: request.markdown.trim(),
    evidenceChunks: chunkEvidence(request.markdown),
  }
}

export function extractFromMarkdownHeuristic(
  request: LlmExtractRequest,
): LlmArticleExtract | LlmRecipeExtract {
  if (request.targetType === 'recipe') {
    return heuristicRecipeExtract(request)
  }
  return heuristicArticleExtract(request)
}

export function isArticleExtract(
  targetType: GenerationTargetType,
  extract: LlmArticleExtract | LlmRecipeExtract,
): extract is LlmArticleExtract {
  return targetType === 'article'
}
