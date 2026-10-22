import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { defineEventHandler } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const folders = await useQueries(event).mediaFolders.listAll()
  return { data: folders }
})
