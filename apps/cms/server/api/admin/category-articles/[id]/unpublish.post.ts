import { handleAdminUnpublish } from '../../../../utils/admin/content-publishing-handlers'
import { defineEventHandler } from 'nuxt/server'

/** Explicit route: `admin/category-articles/` shadows `[contentType]` for category-articles in Nitro. */
export default defineEventHandler(event => handleAdminUnpublish(event, 'category-articles'))
