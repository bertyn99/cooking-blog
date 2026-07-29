import type { H3Event } from 'h3'
import { useQueries } from '../db'

export async function isBootstrapMode(event?: H3Event): Promise<boolean> {
  const total = await useQueries(event).users.countAll()
  return total === 0
}
