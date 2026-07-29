import { describe, expect, it, vi, beforeEach } from 'vitest'
import { extractFromMarkdownHeuristic } from '../../server/services/generation/llm-extract-heuristic'
import { runLlmExtract } from '../../server/services/generation/llm-extract'
import { createHeuristicLlmClient } from '../../server/services/generation/llm-client'
import {
  llmArticleExtractSchema,
  llmRecipeExtractSchema,
} from '../../server/utils/validations/llm-extract'

vi.mock('../../server/utils/cloudflare-env', () => ({
  getCloudflareEnv: () => undefined,
}))

const recipeMarkdown = `# Tarte aux pommes

Une tarte classique et fondante.

## Ingrédients

- 3 pommes
- 200 g farine
- 100 g beurre

## Préparation

1. Préchauffer le four à 180°C.
2. Éplucher les pommes et les couper en lamelles.
`

describe('llm extract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('heuristically extracts a recipe with ingredients and steps', () => {
    const result = extractFromMarkdownHeuristic({
      targetType: 'recipe',
      locale: 'fr',
      markdown: recipeMarkdown,
    })

    expect(llmRecipeExtractSchema.safeParse(result).success).toBe(true)
    expect(result.title).toBe('Tarte aux pommes')
    expect(result.ingredients?.length).toBeGreaterThanOrEqual(3)
    expect(result.steps?.length).toBeGreaterThanOrEqual(2)
    expect(result.evidenceChunks.length).toBeGreaterThan(0)
  })

  it('heuristically extracts an article with content and evidence', () => {
    const markdown = '# Conseils de saison\n\nLes légumes racines sont au menu.\n\n## Conservation\n\nGardez-les au frais.'
    const result = extractFromMarkdownHeuristic({
      targetType: 'article',
      locale: 'fr',
      markdown,
    })

    expect(llmArticleExtractSchema.safeParse(result).success).toBe(true)
    expect(result.title).toBe('Conseils de saison')
    expect(result.content).toContain('légumes racines')
  })

  it('runLlmExtract fails without source markdown', async () => {
    await expect(runLlmExtract({
      targetType: 'article',
      source: { title: 'Sans contenu', sourceKind: 'paste' },
      locale: 'fr',
    })).rejects.toThrow(/markdown is required/)
  })

  it('runLlmExtract falls back to heuristic without Workers AI', async () => {
    const result = await runLlmExtract({
      targetType: 'recipe',
      source: { markdown: recipeMarkdown, locale: 'fr', sourceKind: 'paste' },
      locale: 'fr',
    })

    expect(result.provider).toBe('heuristic')
    expect(result.extractedAt).toBeTruthy()
    expect(createHeuristicLlmClient().provider).toBe('heuristic')
  })
})
