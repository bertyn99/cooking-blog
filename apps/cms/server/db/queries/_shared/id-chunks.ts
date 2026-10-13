/** Stay under D1’s ~100 bound-parameter limit for `IN (...)` clauses. */
export const D1_IN_CHUNK = 40

export function chunkIds(ids: number[], size = D1_IN_CHUNK): number[][] {
  const chunks: number[][] = []
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size))
  }
  return chunks
}
