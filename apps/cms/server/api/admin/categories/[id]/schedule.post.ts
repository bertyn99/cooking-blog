import { handleAdminSchedule } from '../../../../utils/admin/content-publishing-handlers'
import { defineEventHandler } from 'nuxt/server'

/** Explicit route: `admin/categories/` shadows `[contentType]` for categories in Nitro. */
export default defineEventHandler(event => handleAdminSchedule(event, 'categories'))
