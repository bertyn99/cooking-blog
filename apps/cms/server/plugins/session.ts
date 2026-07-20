import { eq } from 'drizzle-orm'
import { schema } from '../db/create-db'
import { toSessionUser } from '../utils/auth/user'
import { useDb } from '../utils/db'
import { createError } from 'h3'

export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session, event) => {
    const userId = session.user?.id
    if (!userId) {
      return
    }

    const db = useDb(event)
    const rows = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1)

    const user = rows[0]
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User no longer exists',
      })
    }

    session.user = toSessionUser(user)
  })
})
