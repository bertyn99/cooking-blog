import { z } from 'zod'
import { BULK_IDS_MAX } from '../../../shared/content-bulk'

export { BULK_IDS_MAX } from '../../../shared/content-bulk'

export const bulkIdsSchema = z.array(z.number().int().positive()).min(1).max(BULK_IDS_MAX)

export const CONTENT_BULK_ACTIONS = ['delete', 'publish', 'unpublish'] as const
export type ContentBulkAction = (typeof CONTENT_BULK_ACTIONS)[number]

export const bulkContentSchema = z.object({
  ids: bulkIdsSchema,
  action: z.enum(CONTENT_BULK_ACTIONS),
})

export type BulkContentInput = z.infer<typeof bulkContentSchema>

export const PAGE_BULK_ACTIONS = [...CONTENT_BULK_ACTIONS, 'move'] as const
export type PageBulkAction = (typeof PAGE_BULK_ACTIONS)[number]

export const bulkPagesSchema = z.object({
  ids: bulkIdsSchema,
  action: z.enum(PAGE_BULK_ACTIONS),
  parentId: z.number().int().positive().nullable().optional(),
  newParentName: z.string().trim().min(1).max(180).optional(),
}).superRefine((value, ctx) => {
  if (value.action !== 'move') {
    if (value.parentId !== undefined || value.newParentName !== undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'parentId et newParentName sont réservés à l’action « move ».',
      })
    }
    return
  }

  const hasParentId = value.parentId !== undefined
  const hasNewParent = Boolean(value.newParentName)
  if (hasParentId === hasNewParent) {
    ctx.addIssue({
      code: 'custom',
      message: 'Indiquez un parentId (null = racine) ou un newParentName, pas les deux.',
    })
  }
})

export type BulkPagesInput = z.infer<typeof bulkPagesSchema>
