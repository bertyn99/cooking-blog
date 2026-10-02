/** Strip trailing slash from an origin or base URL. */
export function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/$/, '')
}

/**
 * Public origin of this CMS app (admin host).
 * Uses `NUXT_PUBLIC_CMS_BASE_URL` / `CMS_BASE_URL` when set, otherwise the current request origin.
 */
export function useCmsOrigin() {
  const config = useRuntimeConfig()
  const requestUrl = useRequestURL()

  return computed(() => {
    const configured = normalizeOrigin(String(config.public.cmsBaseUrl || ''))
    if (configured) return configured
    return requestUrl.origin
  })
}

/** MCP HTTP endpoint for agent clients (`{cmsOrigin}/mcp`). */
export function useMcpEndpoint() {
  const cmsOrigin = useCmsOrigin()
  return computed(() => `${cmsOrigin.value}/mcp`)
}
