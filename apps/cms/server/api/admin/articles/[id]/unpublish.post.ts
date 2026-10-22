import { handleAdminUnpublish } from '../../../../utils/admin/content-publishing-handlers'
import { defineEventHandler } from 'nuxt/server'

export default defineEventHandler(event => handleAdminUnpublish(event, 'articles'))
