import { handleAdminUnpublish } from '../../../../utils/admin/content-publishing-handlers'

export default defineEventHandler(event => handleAdminUnpublish(event, 'articles'))
