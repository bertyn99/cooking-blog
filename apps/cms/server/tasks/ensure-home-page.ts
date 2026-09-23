import { useDb } from '../utils/db'
import { ensureEditorDefaults, ensureHomePage } from '../services/ensure-home-page'

export default defineTask({
  meta: {
    name: 'ensure-home-page',
    description: 'Seed published fr home page with page builder markdown if missing',
  },
  async run() {
    const db = useDb()
    await ensureEditorDefaults(db)
    const id = await ensureHomePage(db)
    return { result: id ? `home page id=${id}` : 'failed' }
  },
})
