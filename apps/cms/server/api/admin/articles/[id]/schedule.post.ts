import { handleAdminSchedule } from '../../../../utils/admin/content-publishing-handlers'

export default defineEventHandler(event => handleAdminSchedule(event, 'articles'))
