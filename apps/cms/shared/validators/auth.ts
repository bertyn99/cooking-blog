import { z } from 'zod'

export const userRoleSchema = z.enum(['admin', 'editor'])

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(512, 'Password is too long')

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(512),
})

export const registerSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  username: z.string().min(1).max(100).optional(),
  password: passwordSchema,
  role: userRoleSchema.optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
