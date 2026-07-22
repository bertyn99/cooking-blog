import { uploadMedia } from '../../utils/media'
import { canEditContent } from '../../../shared/abilities'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const form = await readFormData(event)
  const file = form.get('file') as File | null
  if (!file || !file.size) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  const folderPrefix = (form.get('folderPrefix') as string | null) || undefined
  const uploaded = await uploadMedia(event, file, { folderPrefix })
  setResponseStatus(event, 201)
  return uploaded
})
