import { parseInclude } from '../../utils/populate'
import { parsePagination } from '../../utils/pagination'
import { useQueries } from '../../utils/db'
import { isPrivilegedContentRead } from '../../utils/preview-auth'
import { parseCsvParam } from '../../utils/query-params'
import { isGlossaryKind, type GlossaryKind } from '../../../shared/glossary-normalize'
import { loadAmazonAffiliateTag, attachResolvedAffiliate } from '../../services/glossary-affiliate'
import { serializeGlossaryForScope, serializeGlossaryFamilyRef } from '../../utils/serialize-content'
import { glossarySiblingForms } from '../../../shared/glossary-family'
import { recipePublicPath } from '../../../shared/public-site-paths'
import { defineEventHandler, getQuery } from 'nuxt/server'

function parseFlag(value: unknown): boolean {
  const raw = Array.isArray(value) ? value[0] : value
  return raw === '1' || raw === 'true' || raw === true
}

function parseGlossaryStatus(value: unknown): 'draft' | 'published' | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw === 'draft' || raw === 'published') return raw
  return undefined
}

function parseKind(value: unknown): GlossaryKind | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  return isGlossaryKind(raw) ? raw : undefined
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { glossary } = useQueries(event)
  const isAuthenticated = await isPrivilegedContentRead(event)
  const include = parseInclude(query as Record<string, unknown>)
  const slugs = parseCsvParam(query.slugs)
  const amazonTag = await loadAmazonAffiliateTag(event)

  const page = await glossary.listPage({
    include,
    filters: {
      slug: slugs?.length ? undefined : (query.slug as string | undefined),
      slugs,
      kind: parseKind(query.kind),
      locale: query.locale as string | undefined,
      search: (query.search as string) || undefined,
      status: parseGlossaryStatus(query.status),
      expandFamily: parseFlag(query.expandFamily),
      rootsOnly: parseFlag(query.rootsOnly),
    },
    isAuthenticated,
    pagination: parsePagination(query as Record<string, string>),
  })

  const data = []
  for (const row of page.data) {
    const withAffiliate = attachResolvedAffiliate(row, amazonTag)
    const serialized = serializeGlossaryForScope(
      withAffiliate,
      isAuthenticated ? 'admin' : 'public',
    )
    let recipes: Array<{ id: number, title: string, slug: string, path: string }> | undefined
    let forms: Array<NonNullable<ReturnType<typeof serializeGlossaryFamilyRef>>> | undefined
    if (query.slug && page.data.length === 1) {
      const linked = await glossary.listLinkedRecipes(row.id)
      recipes = linked.map(recipe => ({
        ...recipe,
        path: recipePublicPath(recipe.slug),
      }))
      const members = await glossary.listFamilyMembers(row.id, row.parentId, {
        publishedOnly: !isAuthenticated,
      })
      forms = glossarySiblingForms(members, row)
        .map(member => serializeGlossaryFamilyRef(member))
        .filter((member): member is NonNullable<typeof member> => member != null)
    }
    data.push({
      ...serialized,
      ...(recipes ? { recipes } : {}),
      ...(forms?.length ? { forms } : {}),
    })
  }

  return {
    ...page,
    data,
  }
})
