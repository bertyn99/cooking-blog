import { getPexelsApiKey } from '../../services/stock/pexels'
import { getCloudflareEnv } from '../../utils/cloudflare-env'
import { requireEditor } from '../../utils/http-auth'

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const env = getCloudflareEnv(event)

  return {
    stock: Boolean(getPexelsApiKey()),
    aiGenerate: Boolean(env?.AI),
  }
})
