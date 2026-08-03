import { describe, expect, it } from 'vitest'
import {
  hasArticleEditorialChanges,
  nextVersionAfterHumanReviewEdit,
} from '../../server/utils/human-review-publish'

describe('human-review-publish', () => {
  it('detects article editorial field changes', () => {
    expect(hasArticleEditorialChanges(
      { title: 'A', content: 'x' },
      { title: 'B' },
    )).toBe(true)
    expect(hasArticleEditorialChanges(
      { title: 'A' },
      { status: 'draft' },
    )).toBe(false)
  })

  it('bumps version when human review is required and content changed', () => {
    expect(nextVersionAfterHumanReviewEdit(
      { requiresHumanReview: true, version: 2 },
      true,
    )).toBe(3)
    expect(nextVersionAfterHumanReviewEdit(
      { requiresHumanReview: true, version: 2 },
      false,
    )).toBeUndefined()
  })
})
