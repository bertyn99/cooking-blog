export function isSqliteBusyError(error: unknown): boolean {
  const messages: string[] = []
  if (error instanceof Error) {
    messages.push(error.message)
    if (error.cause instanceof Error) {
      messages.push(error.cause.message)
    }
    else if (error.cause) {
      messages.push(String(error.cause))
    }
  }
  else {
    messages.push(String(error))
  }
  return messages.some(text =>
    text.includes('SQLITE_BUSY') || text.includes('database is locked'),
  )
}
