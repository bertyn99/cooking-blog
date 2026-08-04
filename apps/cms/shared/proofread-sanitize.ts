/**
 * Shared orthographe filters — keep server normalize + client sanitize aligned.
 */

export function levenshtein(a: string, b: string): number {
  if (a === b) {
    return 0
  }
  if (!a.length) {
    return b.length
  }
  if (!b.length) {
    return a.length
  }

  const prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0]!
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j]!
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, prevDiag + cost)
      prevDiag = temp
    }
  }
  return prev[b.length]!
}

/** Small edit distance = likely accent/typo/agreement, not a rewrite. */
export function isPlausibleSpellingFix(original: string, suggestion: string): boolean {
  const left = original.trim()
  const right = suggestion.trim()
  if (!left || !right || left === right) {
    return false
  }
  // Orthographe FR: un seul token (éventuellement avec trait d'union), pas de reformulation.
  if (/\s/.test(left) || /\s/.test(right)) {
    return false
  }
  // Refuse ASCII→ASCII synonym swaps that only share length (noir→vert).
  if (Math.abs(left.length - right.length) > Math.max(2, Math.floor(left.length * 0.35))) {
    return false
  }
  const dist = levenshtein(left.toLowerCase(), right.toLowerCase())
  // Short French words: allow 1 edit (accent / letter). Longer: up to 2–3.
  const maxDist = left.length <= 5
    ? 1
    : left.length <= 10
      ? 2
      : Math.min(3, Math.ceil(left.length * 0.25))
  return dist > 0 && dist <= maxDist
}
