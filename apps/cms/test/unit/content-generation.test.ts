import { describe, expect, it } from 'vitest'
import {
  GENERATION_STEP_KEYS,
  generationRetryBackoffMs,
} from '../../server/db/queries/content-generation'

describe('content generation pipeline', () => {
  it('defines the PR3 step machine keys in order', () => {
    expect(GENERATION_STEP_KEYS).toEqual([
      'normalize',
      'classify',
      'keyword_research',
      'extract',
      'assemble',
      'validate',
      'generate_cover',
    ])
  })

  it('maps review rounds to revise steps', async () => {
    const { reviseStepKeyForRound } = await import('../../server/db/queries/content-generation')
    expect(reviseStepKeyForRound(1)).toBe('revise_1')
    expect(reviseStepKeyForRound(2)).toBe('revise_2')
  })

  it('allows request_changes only on article gates 1–2', async () => {
    const { canRequestChanges } = await import('../../server/services/generation/review-event')
    expect(canRequestChanges('article', 1)).toBe(true)
    expect(canRequestChanges('article', 2)).toBe(true)
    expect(canRequestChanges('article', 3)).toBe(false)
    expect(canRequestChanges('recipe', 1)).toBe(false)
  })

  it('uses escalating backoff for step retries', () => {
    expect(generationRetryBackoffMs(1)).toBe(30_000)
    expect(generationRetryBackoffMs(2)).toBe(120_000)
    expect(generationRetryBackoffMs(3)).toBe(300_000)
    expect(generationRetryBackoffMs(9)).toBe(300_000)
  })

  it('splits ebook markdown into heading candidates', async () => {
    const { discoverCandidatesFromMarkdown } = await import(
      '../../server/services/generation/discover-candidates'
    )
    const result = discoverCandidatesFromMarkdown({
      markdown: [
        '# Tarte aux pommes',
        '',
        'Ingrédients: pommes, farine, beurre, sucre.',
        'Préparation: mélanger la pâte puis enfourner 40 minutes.',
        '',
        '# Conseils de saison',
        '',
        'Voici pourquoi choisir des fruits locaux pour votre cuisine au quotidien.',
        'Ce guide explique comment composer un panier de marché équilibré.',
      ].join('\n'),
      preferredTargetType: 'recipe',
    })
    expect(result.strategy).toBe('heading-split')
    expect(result.candidates.length).toBe(2)
    expect(result.candidates[0]?.targetType).toBe('recipe')
    expect(result.candidates[1]?.targetType).toBe('article')
  })
})
