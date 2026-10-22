import { handleAdminPublish } from '../../../../utils/admin/content-publishing-handlers'
import { defineEventHandler } from 'nuxt/server'

/** Explicit route: `admin/articles/` shadows `[contentType]` for articles in Nitro. */
export default defineEventHandler(event => handleAdminPublish(event, 'articles'))
