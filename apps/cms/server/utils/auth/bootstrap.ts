import type { H3Event } from 'nitro/h3'
import { hasAdminUser } from '../../db/seed/admin'
import { useQueries } from '../db'
import { useDb } from '../db'

/** No rows in `users` — first `POST /api/auth/register` becomes admin. */
export async function isBootstrapMode(event?: H3Event): Promise<boolean> {
  const total = await useQueries(event).users.countAll()
  return total === 0
}

/** No `role = admin` user — initial admin can be seeded without `ADMIN_SEED_SECRET`. */
export async function lacksAdminUser(event?: H3Event): Promise<boolean> {
  const db = useDb(event)
  return !(await hasAdminUser(db))
}

