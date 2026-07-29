import { z } from 'zod'
import { passwordSchema, userRoleSchema } from './auth'

export const createStaffUserSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  username: z.string().min(1).max(100).optional(),
  password: passwordSchema,
  role: userRoleSchema.default('editor'),
})

export const updateStaffUserSchema = z.object({
  username: z.string().min(1).max(100).nullable().optional(),
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
}).refine(
  data => data.username !== undefined || data.role !== undefined || data.isActive !== undefined,
  { message: 'Au moins un champ doit être fourni.' },
)

export type CreateStaffUserInput = z.infer<typeof createStaffUserSchema>
export type UpdateStaffUserInput = z.infer<typeof updateStaffUserSchema>
