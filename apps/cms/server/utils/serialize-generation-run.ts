/** Strip worker-only fields from generation run API responses. */
export function serializeGenerationRunForApi<T extends Record<string, unknown>>(run: T) {
  const { leaseToken: _leaseToken, ...rest } = run
  return rest
}
