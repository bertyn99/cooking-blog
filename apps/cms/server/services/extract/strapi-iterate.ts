import type { ExtractContext } from './types'
import type { createStrapiClient } from './strapi-client'

type StrapiClient = ReturnType<typeof createStrapiClient>

export async function* iterateStrapiRows<T extends { slug: string, locale?: string | null }>(
  ctx: ExtractContext,
  client: StrapiClient,
  collection: string,
  extraQuery?: Record<string, string>,
): AsyncGenerator<T> {
  const filter = ctx.slugFilter
  if (filter?.slug) {
    const locale = filter.locale ?? 'fr'
    const row = await client.findBySlug<T>(collection, filter.slug, locale, extraQuery)
    if (!row) {
      ctx.log(
        `Introuvable dans Strapi (${collection}) : slug « ${filter.slug} » (locale ${locale}).`,
      )
      return
    }
    yield row
    return
  }

  for await (const row of client.listAll<T>(collection, 100, extraQuery)) {
    yield row
  }
}
