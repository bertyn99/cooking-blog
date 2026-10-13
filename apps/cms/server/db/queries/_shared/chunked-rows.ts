import { chunkIds } from './id-chunks'

export async function mapIdChunks<T>(
  ids: number[],
  loadChunk: (chunk: number[]) => Promise<T[]>,
): Promise<T[]> {
  if (!ids.length) return []
  const rows: T[] = []
  for (const chunk of chunkIds(ids)) {
    rows.push(...await loadChunk(chunk))
  }
  return rows
}

export async function forIdChunks(
  ids: number[],
  runChunk: (chunk: number[]) => Promise<void>,
): Promise<void> {
  if (!ids.length) return
  for (const chunk of chunkIds(ids)) {
    await runChunk(chunk)
  }
}
