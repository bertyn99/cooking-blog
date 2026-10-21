import { handleAdminSchedule } from '../../../../utils/admin/content-publishing-handlers'
import { defineEventHandler } from 'nuxt/server'

export default defineEventHandler(event => handleAdminSchedule(event, 'articles'))
