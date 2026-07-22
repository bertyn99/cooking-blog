import { eq } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { queryInternal } from '../../db/query-errors'
import { getSeoFilter, getSeoForContent } from '../../utils/seo'

export type SeoContentType = 'article' | 'recipe' | 'page'

export interface SeoUpsertBody {
  description?: string
  keywords?: string
  metaRobots?: string
  socialMeta?: Array<{
    socialNetwork: 'Facebook' | 'Twitter'
    title?: string
    description?: string
    imageBlobPathname?: string
  }>
}

export function createSeoQueries(db: AppDb) {
  return {
    findByContent(contentType: SeoContentType, contentId: number) {
      return getSeoForContent(db, contentType, contentId)
    },

    async upsertForContent(contentType: SeoContentType, contentId: number, body: SeoUpsertBody) {
      const filter = getSeoFilter(contentType, contentId)

      const seoId = await db.transaction(async (tx) => {
        const existing = await tx
          .select({ id: schema.seo.id })
          .from(schema.seo)
          .where(filter)
          .limit(1)
          .all()

        let id: number

        if (existing.length > 0) {
          id = existing[0]!.id
          await tx
            .update(schema.seo)
            .set({
              description: body.description !== undefined ? body.description : undefined,
              keywords: body.keywords !== undefined ? body.keywords : undefined,
              metaRobots: body.metaRobots !== undefined ? body.metaRobots : undefined,
            })
            .where(eq(schema.seo.id, id))
        }
        else {
          const insertResult = await tx
            .insert(schema.seo)
            .values({
              articleId: contentType === 'article' ? contentId : null,
              recipeId: contentType === 'recipe' ? contentId : null,
              pageId: contentType === 'page' ? contentId : null,
              description: body.description ?? null,
              keywords: body.keywords ?? null,
              metaRobots: body.metaRobots ?? null,
            })
            .returning({ id: schema.seo.id })
            .all()

          const inserted = insertResult[0]
          if (!inserted) {
            tx.rollback()
            throw queryInternal('Failed to create SEO record')
          }
          id = inserted.id
        }

        if (body.socialMeta !== undefined) {
          await tx
            .delete(schema.socialMeta)
            .where(eq(schema.socialMeta.seoId, id))

          if (body.socialMeta.length > 0) {
            await tx.insert(schema.socialMeta).values(
              body.socialMeta.map(sm => ({
                seoId: id,
                socialNetwork: sm.socialNetwork,
                title: sm.title ?? null,
                description: sm.description ?? null,
                imageBlobPathname: sm.imageBlobPathname ?? null,
              })),
            )
          }
        }

        return id
      })

      const seo = await db.query.seo.findFirst({
        where: { id: seoId },
        with: { socialMeta: true },
      })

      if (!seo) {
        throw queryInternal('Failed to retrieve created/updated SEO record')
      }

      return seo
    },
  }
}
