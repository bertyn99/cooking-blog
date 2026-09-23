import { CMS_FETCH_DEFAULTS } from '~/utils/cms-query'

function resolveCmsBaseUrl(): string {
  const config = useRuntimeConfig()
  return String(config.public.cmsBaseUrl || config.public.apiBase || 'http://localhost:3001').replace(/\/$/, '')
}

export default defineNuxtPlugin(() => {
  const cms = $fetch.create({
    ...CMS_FETCH_DEFAULTS,
    baseURL: `${resolveCmsBaseUrl()}/api`,
  })

  return {
    provide: {
      cms,
    },
  }
})
