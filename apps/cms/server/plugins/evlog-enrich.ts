import { createDefaultEnrichers } from 'evlog/enrichers'
import { defineNitroPlugin } from 'nitropack/runtime'

const enrichRequest = createDefaultEnrichers()

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('evlog:enrich', (context) => enrichRequest(context))
})
