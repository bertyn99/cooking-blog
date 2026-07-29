/**
 * Cloudflare Workflows HITL event for content generation.
 * One event type; action discriminator. Persist D1 before sendEvent.
 */
export const GENERATION_REVIEW_EVENT_TYPE = 'generation-review' as const

export const GENERATION_REVIEW_ACTIONS = [
  'approve',
  'reject',
  'request_changes',
] as const

export type GenerationReviewAction = (typeof GENERATION_REVIEW_ACTIONS)[number]

export interface GenerationReviewEventPayload {
  action: GenerationReviewAction
  reviewerUserId: number
  /** Gate number (1..3 for articles; 1 for recipes). */
  round: number
  reviewNote?: string | null
  /** Required for reject. */
  reason?: string | null
  /** Optional hints for revise agent (section / step focus). */
  focusSteps?: string[] | null
}

export const MAX_ARTICLE_REVIEW_GATES = 3
export const MAX_RECIPE_REVIEW_GATES = 1
/** request_changes allowed only on gates 1..(maxGates - 1) → 2 fixes for articles. */
export const MAX_ARTICLE_FIXES = MAX_ARTICLE_REVIEW_GATES - 1

export function maxReviewGatesForTarget(targetType: 'article' | 'recipe') {
  return targetType === 'article' ? MAX_ARTICLE_REVIEW_GATES : MAX_RECIPE_REVIEW_GATES
}

export function canRequestChanges(targetType: 'article' | 'recipe', round: number) {
  return targetType === 'article' && round >= 1 && round <= MAX_ARTICLE_FIXES
}

export function reviewNotesArtifactKey(round: number) {
  return `review-notes-${round}` as const
}
