import type { ApiClient } from '~/types/api'

/**
 * Authenticated API client for the CMS.
 *
 * - Client: same-origin $fetch sends the nuxt-auth-utils session cookie automatically.
 * - SSR: useRequestFetch() forwards the incoming Cookie header to internal /api/* calls
 *   (plain $fetch does not — see Nuxt data-fetching + nuxt-auth-utils SSR docs).
 */
export default defineNuxtPlugin(() => {
  const api: ApiClient = <T>(url: string, opts?: object): Promise<T> => {
    if (import.meta.server) {
      return (useRequestFetch() as unknown as ApiClient)<T>(url, opts)
    }
    return ($fetch as unknown as ApiClient)<T>(url, opts)
  }

  return {
    provide: {
      api,
    },
  }
})
