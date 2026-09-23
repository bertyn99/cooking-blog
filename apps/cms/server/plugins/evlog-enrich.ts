import { createDefaultEnrichers } from 'evlog/enrichers'

const enrichRequest = createDefaultEnrichers()

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('evlog:enrich', (context) => enrichRequest(context))
})
