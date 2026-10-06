import { eq } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { queryInternal } from '../../db/query-errors'
import { getSeoFilter, getSeoForContent } from '../../utils/seo'

export type SeoContentType = 'article' | 'recipe' | 'page'

export interface SeoUpsertBody {
  description?: string
  keywords?: string
  canonicalUrl?: string
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

      // D1 does not support interactive transactions (`begin` fails at the
      // driver level), so the former db.transaction block runs as sequential
      // statements. The upsert is idempotent and low-contention (admin UI +
      // MCP); a concurrent insert race falls back to the update path below.
      const existing = await db
        .select({ id: schema.seo.id })
        .from(schema.seo)
        .where(filter)
        .limit(1)
        .all()

      let id: number

      if (existing.length > 0) {
        id = existing[0]!.id
        await db
          .update(schema.seo)
          .set({
            description: body.description !== undefined ? body.description : undefined,
            keywords: body.keywords !== undefined ? body.keywords : undefined,
            canonicalUrl: body.canonicalUrl !== undefined ? body.canonicalUrl : undefined,
            metaRobots: body.metaRobots !== undefined ? body.metaRobots : undefined,
          })
          .where(eq(schema.seo.id, id))
      }
      else {
        const insertResult = await db
          .insert(schema.seo)
          .values({
            articleId: contentType === 'article' ? contentId : null,
            recipeId: contentType === 'recipe' ? contentId : null,
            pageId: contentType === 'page' ? contentId : null,
            description: body.description ?? null,
            keywords: body.keywords ?? null,
            canonicalUrl: body.canonicalUrl ?? null,
            metaRobots: body.metaRobots ?? null,
          })
          .returning({ id: schema.seo.id })
          .all()

        const inserted = insertResult[0]
        if (!inserted) {
          throw queryInternal('Failed to create SEO record')
        }
        id = inserted.id
      }

        if (body.socialMeta !== undefined) {
          await db
            .delete(schema.socialMeta)
            .where(eq(schema.socialMeta.seoId, id))

          if (body.socialMeta.length > 0) {
            await db.insert(schema.socialMeta).values(
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

        const seo = await db.query.seo.findFirst({
          where: { id },
          with: { socialMeta: true },
        })

        if (!seo) {
          throw queryInternal('Failed to retrieve created/updated SEO record')
        }

        return seo
    },
  }
}
