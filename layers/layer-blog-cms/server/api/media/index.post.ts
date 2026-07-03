import { uploadMedia } from '../../utils/media'

export default defineEventHandler(async (event) => {
  const form = await readFormData(event)
  const file = form.get('file') as File | null
  if (!file || !file.size) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  const uploaded = await uploadMedia(file)
  setResponseStatus(event, 201)
  return uploaded
})
