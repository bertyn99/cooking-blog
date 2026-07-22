/** Preserve SQL list order after a relational `findMany({ id: { in } })`. */
export function reorderByIds<T extends { id: number }>(rows: T[], ids: number[]): T[] {
  const order = new Map(ids.map((id, index) => [id, index]))
  return [...rows].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
}
