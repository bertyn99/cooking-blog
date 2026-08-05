import { Extension } from '@tiptap/core'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export interface AiReviewHighlightRange {
  from: number
  to: number
  /** `old` = original selection (rose), `error` = proofread span (amber/rose). */
  kind: 'old' | 'error'
  /** Optional correction id for proofread spans. */
  id?: string
}

export interface AiReviewHighlightStorage {
  ranges: AiReviewHighlightRange[]
  setRanges: (ranges: AiReviewHighlightRange[]) => void
  clear: () => void
}

export const aiReviewHighlightPluginKey = new PluginKey('aiReviewHighlight')
export const aiReviewHighlightUpdateMeta = 'aiReviewHighlightUpdate'

/**
 * Inline decorations for AI review: original text (rose) and per-error spans.
 * Proposed text lives in the review panel (green), not as an in-doc duplicate.
 */
export const AiReviewHighlightExtension = Extension.create<
  Record<string, never>,
  AiReviewHighlightStorage
>({
  name: 'aiReviewHighlight',

  addStorage() {
    return {
      ranges: [] as AiReviewHighlightRange[],
      setRanges(ranges: AiReviewHighlightRange[]) {
        this.ranges = ranges
      },
      clear() {
        this.ranges = []
      },
    }
  },

  addProseMirrorPlugins() {
    const storage = this.storage

    return [
      new Plugin({
        key: aiReviewHighlightPluginKey,
        state: {
          init() {
            return 0
          },
          apply(tr, tick) {
            if (tr.docChanged && storage.ranges.length) {
              const docSize = tr.doc.content.size
              storage.ranges = storage.ranges
                .map((range) => {
                  const from = tr.mapping.map(range.from, -1)
                  const to = tr.mapping.map(range.to, 1)
                  return { ...range, from, to }
                })
                .filter(range =>
                  range.to > range.from
                  && range.from >= 0
                  && range.to <= docSize,
                )
            }
            if (tr.getMeta(aiReviewHighlightUpdateMeta) || tr.docChanged) {
              return tick + 1
            }
            return tick
          },
        },
        props: {
          decorations(state) {
            if (!storage.ranges.length) {
              return DecorationSet.empty
            }

            const decorations = storage.ranges
              .filter(range => range.to > range.from && range.from >= 0 && range.to <= state.doc.content.size)
              .map((range) => {
                const className = range.kind === 'old'
                  ? 'ai-review-old'
                  : 'ai-review-error'
                return Decoration.inline(range.from, range.to, {
                  class: className,
                  ...(range.id ? { 'data-ai-correction-id': range.id } : {}),
                })
              })

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})
