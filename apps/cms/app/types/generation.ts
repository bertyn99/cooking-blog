/** Client-side mirrors of generation-run API shapes (CMS UI). */

export type GenerationTargetType = 'article' | 'recipe'
export type GenerationSourceKind = 'paste' | 'article' | 'ebook'
export type GenerationRunKind = 'unit' | 'batch'

export interface DiscoverCandidate {
  id: string
  title: string
  targetType: GenerationTargetType
  markdown: string
  charStart: number
  charEnd: number
  confidence: number
}

export interface DiscoverArtifact {
  candidates: DiscoverCandidate[]
  discoveredAt: string
  strategy: 'heading-split' | 'single-fallback'
  note?: string
}

export interface GenerationRunDetailResponse {
  data: GenerationRun
  meta?: {
    children?: GenerationRun[]
    discover?: DiscoverArtifact | null
  }
}

export type GenerationStepKey
  = 'normalize'
    | 'classify'
    | 'keyword_research'
    | 'extract'
    | 'assemble'
    | 'validate'
    | 'generate_cover'
    | 'discover'
    | 'revise_1'
    | 'revise_2'

export type GenerationRunStatus
  = 'queued'
    | 'running'
    | 'revising'
    | 'awaiting_selection'
    | 'awaiting_review'
    | 'approved'
    | 'rejected'
    | 'failed'
    | 'canceled'

export type GenerationStepStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped'

export type GenerationReviewAction = 'approve' | 'reject' | 'request_changes'

export interface GenerationSourcePackInput {
  sourceKind?: GenerationSourceKind
  title?: string
  locale?: string
  markdown: string
  sourceUrl?: string
  ebookObjectKey?: string
}

export interface GenerationRunStep {
  id: number
  runId: string
  stepKey: GenerationStepKey
  ordinal: number
  status: GenerationStepStatus
  attemptCount: number | null
  idempotencyKey: string
  artifactKey: string | null
  lastError: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface GenerationRun {
  id: string
  targetType: GenerationTargetType
  articleId: number | null
  recipeId: number | null
  artifactPrefix: string
  requestedByUserId: number | null
  parentRunId?: string | null
  runKind?: GenerationRunKind
  reviewRound?: number | null
  status: GenerationRunStatus
  attemptCount: number | null
  maxAttempts: number | null
  nextAttemptAt: string | null
  lastError: string | null
  heartbeatAt: string | null
  reviewedAt: string | null
  reviewedByUserId: number | null
  reviewedArticleVersion: number | null
  reviewedRecipeVersion: number | null
  reviewNote: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
  steps?: GenerationRunStep[]
}

export interface GenerationProgress {
  runId: string
  stepKey: GenerationStepKey | 'queued' | 'awaiting_review' | 'failed'
  status: 'pending' | 'running' | 'succeeded' | 'failed'
  updatedAt: string
  message?: string
}

export interface CreateGenerationRunBody {
  targetType: GenerationTargetType
  sourcePack: GenerationSourcePackInput
  articleId?: number
  recipeId?: number
}

export interface GenerationRunResponse {
  data: GenerationRun
}

export interface GenerationRunListResponse {
  data: GenerationRun[]
  meta: { count: number, status: 'awaiting_review' }
}

export interface GenerationProgressResponse {
  data: GenerationProgress | null
}

export const GENERATION_STEP_LABELS: Record<GenerationStepKey, string> = {
  normalize: 'Normalisation',
  classify: 'Classification',
  keyword_research: 'Mots-clés SEO',
  extract: 'Extraction (agent)',
  assemble: 'Assemblage brouillon',
  validate: 'Validation',
  generate_cover: 'Couverture',
  discover: 'Découverte (ebook)',
  revise_1: 'Révision 1',
  revise_2: 'Révision 2',
}

export const GENERATION_RUN_STATUS_LABELS: Record<GenerationRunStatus, string> = {
  queued: 'En file',
  running: 'En cours',
  revising: 'Révision IA',
  awaiting_selection: 'Sélection candidats',
  awaiting_review: 'À relire',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  failed: 'Échec',
  canceled: 'Annulé',
}
