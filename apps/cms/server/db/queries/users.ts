import { and, count, desc, eq, ne } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import type { StaffUserPublic } from '../../shared/staff'

import { AGENT_USER_EMAIL } from '../seed/agent'

export type UserRole = 'admin' | 'editor' | 'agent'

function toStaffPublic(row: typeof schema.users.$inferSelect): StaffUserPublic {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
    isActive: row.isActive,
    deactivatedAt: row.deactivatedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function createUserQueries(db: AppDb) {
  return {
    async countAll(): Promise<number> {
      const [row] = await db.select({ value: count() }).from(schema.users)
      return Number(row?.value ?? 0)
    },

    async countActiveAdmins(excludeUserId?: number): Promise<number> {
      const conditions = [
        eq(schema.users.role, 'admin'),
        eq(schema.users.isActive, true),
      ]
      if (excludeUserId !== undefined) {
        conditions.push(ne(schema.users.id, excludeUserId))
      }
      const [row] = await db
        .select({ value: count() })
        .from(schema.users)
        .where(and(...conditions))
      return Number(row?.value ?? 0)
    },

    findByEmail(email: string) {
      return db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email.toLowerCase()))
        .limit(1)
        .then(rows => rows[0])
    },

    findById(id: number) {
      return db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .limit(1)
        .then(rows => rows[0])
    },

    async listStaff(options: { page: number, pageSize: number }) {
      const offset = (options.page - 1) * options.pageSize
      const [totalRow] = await db.select({ value: count() }).from(schema.users)
      const total = Number(totalRow?.value ?? 0)

      const rows = await db
        .select()
        .from(schema.users)
        .orderBy(desc(schema.users.createdAt))
        .limit(options.pageSize)
        .offset(offset)

      return {
        data: rows.map(toStaffPublic),
        meta: {
          pagination: {
            page: options.page,
            pageSize: options.pageSize,
            total,
            pageCount: Math.max(1, Math.ceil(total / options.pageSize)),
          },
        },
      }
    },

    async insert(values: {
      email: string
      username: string | null
      passwordHash: string
      role: UserRole
      isActive?: boolean
    }) {
      const now = new Date().toISOString()
      const inserted = await db
        .insert(schema.users)
        .values({
          email: values.email.toLowerCase(),
          username: values.username,
          passwordHash: values.passwordHash,
          role: values.role,
          isActive: values.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
      return inserted[0]
    },

    async updateStaff(
      id: number,
      patch: {
        username?: string | null
        role?: UserRole
        isActive?: boolean
      },
    ) {
      const existing = await this.findById(id)
      if (!existing) return null

      if (existing.role === 'agent' || existing.email === AGENT_USER_EMAIL) {
        return null
      }

      const now = new Date().toISOString()
      const nextActive = patch.isActive ?? existing.isActive
      const deactivatedAt = nextActive
        ? null
        : (existing.deactivatedAt ?? now)

      const [updated] = await db
        .update(schema.users)
        .set({
          ...(patch.username !== undefined ? { username: patch.username } : {}),
          ...(patch.role !== undefined ? { role: patch.role } : {}),
          isActive: nextActive,
          deactivatedAt: nextActive ? null : deactivatedAt,
          updatedAt: now,
        })
        .where(eq(schema.users.id, id))
        .returning()

      return updated ? toStaffPublic(updated) : null
    },

    emailExists(email: string) {
      return db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.email, email.toLowerCase()))
        .limit(1)
        .then(rows => rows.length > 0)
    },
  }
}
