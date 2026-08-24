import { createDefaultEnrichers } from 'evlog/enrichers'
import { definePlugin } from 'nitro'

const enrichRequest = createDefaultEnrichers()

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook('evlog:enrich', (context) => enrichRequest(context))
})
