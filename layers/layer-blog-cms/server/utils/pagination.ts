export function parsePagination(query: Record<string, any>) {
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const pageSize = Math.min(100, parseInt(query.pageSize as string) || 10) // Cap at 100
  return { offset: (page - 1) * pageSize, limit: pageSize, page, pageSize }
}

export function paginateResult<T>(data: T[], total: number, page: number, pageSize: number) {
  const pageCount = Math.ceil(total / pageSize)
  return {
    data,
    meta: {
      pagination: { page, pageSize, pageCount, total },
    },
  }
}
