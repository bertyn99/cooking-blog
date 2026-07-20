import { uploadMedia } from '../../utils/media'
import { canEditContent } from '../../../shared/abilities'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const form = await readFormData(event)
  const file = form.get('file') as File | null
  if (!file || !file.size) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  const uploaded = await uploadMedia(event, file, useDb(event))
  setResponseStatus(event, 201)
  return uploaded
})
