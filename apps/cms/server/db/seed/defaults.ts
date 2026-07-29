import { z } from 'zod'

export const DEFAULT_ADMIN_EMAIL = 'admin@journalducuistot.fr'
export const DEFAULT_ADMIN_PASSWORD = 'changeme123'

export const seedAdminPayloadSchema = z.object({
  email: z.string().email().max(255).optional(),
  password: z.string().min(8).max(512).optional(),
  username: z.string().min(1).max(100).optional(),
  force: z.boolean().optional(),
})

export type SeedAdminPayload = z.infer<typeof seedAdminPayloadSchema>

export function resolveSeedAdminInput(payload: SeedAdminPayload = {}) {
  const parsed = seedAdminPayloadSchema.parse(payload)

  return {
    email: parsed.email?.trim().toLowerCase()
      || process.env.ADMIN_EMAIL?.trim().toLowerCase()
      || DEFAULT_ADMIN_EMAIL,
    password: parsed.password
      || process.env.ADMIN_PASSWORD
      || DEFAULT_ADMIN_PASSWORD,
    username: parsed.username ?? process.env.ADMIN_USERNAME?.trim() ?? null,
    skipIfAdminExists: !(parsed.force ?? process.env.ADMIN_SEED_FORCE === '1'),
  }
}
