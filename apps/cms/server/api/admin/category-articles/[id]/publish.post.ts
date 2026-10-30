import { handleAdminPublish } from '../../../../utils/admin/content-publishing-handlers'
import { defineEventHandler } from 'nuxt/server'

/** Explicit route: `admin/category-articles/` shadows `[contentType]` for category-articles in Nitro. */
export default defineEventHandler(event => handleAdminPublish(event, 'category-articles'))
