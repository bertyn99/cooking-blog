import type { EditorCompletionMode, ProofreadCorrection } from '#shared/editor-completion-modes'

export type AiReviewKind = 'continue' | 'reformulate' | 'proofread'

export interface AiReviewAnchor {
  top: number
  bottom: number
  left: number
  right: number
}

export interface AiReviewPanelModel {
  kind: AiReviewKind
  mode: EditorCompletionMode
  original: string
  variants: string[]
  activeVariant: number
  status: 'streaming' | 'ready' | 'error'
  proofread: Array<ProofreadCorrection & { decision: 'pending' | 'accept' | 'reject' }>
  /** Viewport coords of the selection used as popover anchor. */
  anchor: AiReviewAnchor | null
}
