import { sql } from 'drizzle-orm'
import { useDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const db = useDb(event)
    await db.run(sql`SELECT 1`)
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    }
  }
  catch (error) {
    setResponseStatus(event, 503)
    return {
      status: 'degraded',
      database: 'unavailable',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'unknown',
    }
  }
})
