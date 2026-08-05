import type { Node as PmNode } from '@tiptap/pm/model'
import type { ProofreadCorrection } from '#shared/editor-completion-modes'
import { isPlausibleSpellingFix, proofreadMaxSpanChars } from '#shared/proofread-sanitize'

/**
 * Map a UTF-16 offset inside `doc.textBetween(rangeFrom, rangeTo, blockSeparator)`
 * back to a ProseMirror document position.
 */
export function plainOffsetToDocPos(
  doc: PmNode,
  rangeFrom: number,
  rangeTo: number,
  plainOffset: number,
  blockSeparator = '\n',
): number {
  if (plainOffset <= 0) {
    return rangeFrom
  }

  let remaining = plainOffset
  let mapped = rangeFrom
  let seenText = false
  let lastTextParent: PmNode | null = null
  let done = false

  doc.nodesBetween(rangeFrom, rangeTo, (node, pos, parent) => {
    if (done) {
      return false
    }
    if (!node.isText || !parent) {
      return
    }

    if (seenText && parent !== lastTextParent && blockSeparator) {
      if (remaining <= blockSeparator.length) {
        mapped = Math.max(pos, rangeFrom)
        done = true
        return false
      }
      remaining -= blockSeparator.length
    }

    lastTextParent = parent
    seenText = true

    const from = Math.max(pos, rangeFrom)
    const to = Math.min(pos + node.nodeSize, rangeTo)
    const len = to - from
    if (len <= 0) {
      return
    }

    if (remaining <= len) {
      mapped = from + remaining
      done = true
      return false
    }

    remaining -= len
  })

  return mapped
}

export function proofreadRangesInDoc(
  doc: PmNode,
  rangeFrom: number,
  rangeTo: number,
  corrections: Array<Pick<ProofreadCorrection, 'id' | 'start' | 'end' | 'original'>>,
  blockSeparator = '\n',
): Array<{ from: number, to: number, id: string }> {
  return corrections.flatMap((item) => {
    const from = plainOffsetToDocPos(doc, rangeFrom, rangeTo, item.start, blockSeparator)
    const to = plainOffsetToDocPos(doc, rangeFrom, rangeTo, item.end, blockSeparator)
    if (to <= from || from < rangeFrom || to > rangeTo) {
      return []
    }
    // Guard against bad offsets painting unrelated words outside the error.
    const slice = doc.textBetween(from, to, blockSeparator)
    if (item.original && slice !== item.original) {
      return []
    }
    return [{ from, to, id: item.id }]
  })
}

/**
 * Drop no-ops, duplicates, rewrites, and spans that cover almost the whole selection
 * (those paint random words and confuse authors).
 */
export function sanitizeProofreadCorrections(
  text: string,
  corrections: ProofreadCorrection[],
): ProofreadCorrection[] {
  const maxSpan = proofreadMaxSpanChars(text.length)
  const seen = new Set<string>()
  const out: ProofreadCorrection[] = []

  for (const item of corrections) {
    if (!isPlausibleSpellingFix(item.original, item.suggestion)) {
      continue
    }
    if (item.end <= item.start) {
      continue
    }
    const span = item.end - item.start
    if (span > maxSpan) {
      continue
    }
    if (text.slice(item.start, item.end) !== item.original) {
      continue
    }

    const key = `${item.start}:${item.end}:${item.suggestion}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    out.push(item)
  }

  // Prefer non-overlapping: keep earlier shorter spans first.
  out.sort((a, b) => a.start - b.start || (a.end - a.start) - (b.end - b.start))
  const nonOverlap: ProofreadCorrection[] = []
  let cursor = 0
  for (const item of out) {
    if (item.start < cursor) {
      continue
    }
    nonOverlap.push(item)
    cursor = item.end
  }

  return nonOverlap
}
