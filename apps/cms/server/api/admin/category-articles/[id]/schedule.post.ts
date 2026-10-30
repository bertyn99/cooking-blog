import { handleAdminSchedule } from '../../../../utils/admin/content-publishing-handlers'
import { defineEventHandler } from 'nuxt/server'

/** Explicit route: `admin/category-articles/` shadows `[contentType]` for category-articles in Nitro. */
export default defineEventHandler(event => handleAdminSchedule(event, 'category-articles'))
