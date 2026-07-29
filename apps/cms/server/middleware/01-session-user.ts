import { syncSessionUserFromDb } from '../utils/session-user'

const PUBLIC_API_PATHS = new Set([
  '/api/auth/login',
  '/api/health',
])

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? event.path
  if (!path.startsWith('/api/')) return
  if (PUBLIC_API_PATHS.has(path)) return

  const session = await getUserSession(event)
  if (!session.user?.id) return

  await syncSessionUserFromDb(event)
})
