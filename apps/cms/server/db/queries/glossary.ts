import { and, desc, eq, inArray, isNull, like, or, sql, type BatchItem } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { paginateResult } from '../../utils/pagination'
import { mergeConditions, applyPublishedScope, localeFilter, statusFilter } from './_shared/filters'
import { reorderByIds } from './_shared/list-page'
import { reserveUniqueSlugInLocale } from './_shared/reserve-slug'
import { glossaryAliases, glossaryTerms } from '../schema/glossary-terms'
import type { GlossaryKind } from '../../../shared/glossary-normalize'
import { glossarySortKey, glossaryTermSlugFromName, parseIngredientDisplayName } from '../../../shared/glossary-normalize'
import {
  GLOSSARY_INGREDIENT_FORM_FAMILIES,
  knownIngredientFamilyRootName,
  normalizeGlossaryCatalogKey,
} from '../../../shared/glossary-form-families'
import type { GlossaryUtensilCategory } from '../../../shared/glossary-icons'
import type { GlossaryQueryFilter, GlossaryWith } from '../query-types'

export type GlossaryTermInsert = typeof schema.glossaryTerms.$inferInsert
export type GlossaryTermUpdate = Partial<Omit<GlossaryTermInsert, 'id' | 'createdAt'>>
export type GlossaryStatus = 'draft' | 'published'
export type GlossaryTermRow = typeof schema.glossaryTerms.$inferSelect

export type GlossaryFamilyBackfillStats = {
  rootsCreated: number
  formsLinked: number
  skipped: number
}

export const GLOSSARY_RELATIONS = ['cover', 'seo', 'aliases', 'relatedArticle'] as const
export type GlossaryRelation = (typeof GLOSSARY_RELATIONS)[number]

export interface GlossaryListFilters {
  slug?: string
  slugs?: string[]
  kind?: GlossaryKind
  locale?: string
  search?: string
  status?: GlossaryStatus
  /** When true, include the family root and sibling forms of each match. */
  expandFamily?: boolean
  /** Family heads only (parent_id IS NULL). */
  rootsOnly?: boolean
}

function buildGlossaryWith(include: string[]): GlossaryWith {
  const expanded = include.includes('*')
    ? [...GLOSSARY_RELATIONS]
    : include.filter(relation => (GLOSSARY_RELATIONS as readonly string[]).includes(relation))

  const withObj: GlossaryWith = { parent: true }
  for (const relation of expanded) {
    switch (relation) {
      case 'cover':
        withObj.cover = true
        break
      case 'seo':
        withObj.seo = { with: { socialMeta: true } }
        break
      case 'aliases':
        withObj.aliases = true
        break
      case 'relatedArticle':
        withObj.relatedArticle = true
        break
      default: {
        const _exhaustive: never = relation
        return _exhaustive
      }
    }
  }
  return withObj
}

function publishedScopeFilter(isAuthenticated: boolean) {
  return applyPublishedScope(glossaryTerms, {
    scope: isAuthenticated ? 'admin' : 'public',
  })
}

function buildGlossaryListWhere(opts: {
  isAuthenticated: boolean
  filters?: GlossaryListFilters
}) {
  const searchTerm = opts.filters?.search ? `%${opts.filters.search}%` : undefined
  const kind = opts.filters?.kind

  return mergeConditions(
    ...applyPublishedScope(glossaryTerms, {
      scope: opts.isAuthenticated ? 'admin' : 'public',
    }),
    opts.filters?.slugs?.length
      ? inArray(glossaryTerms.slug, opts.filters.slugs)
      : opts.filters?.slug
        ? eq(glossaryTerms.slug, opts.filters.slug)
        : undefined,
    kind ? eq(glossaryTerms.kind, kind) : undefined,
    localeFilter(glossaryTerms, opts.filters?.locale),
    statusFilter(glossaryTerms, opts.filters?.status),
    opts.filters?.rootsOnly ? isNull(glossaryTerms.parentId) : undefined,
    searchTerm
      ? or(
          like(glossaryTerms.name, searchTerm),
          like(glossaryTerms.slug, searchTerm),
          like(glossaryTerms.sortKey, searchTerm),
        )
      : undefined,
  )
}

export function createGlossaryQueries(db: AppDb) {
  return {
    async listPage(opts: {
      include: string[]
      filters?: GlossaryListFilters
      isAuthenticated: boolean
      pagination: { offset: number, limit: number, page: number, pageSize: number }
    }) {
      const where = buildGlossaryListWhere(opts)
      const searchNormalized = opts.filters?.search
        ? glossarySortKey(opts.filters.search)
        : ''

      let aliasTermIds: number[] = []
      if (searchNormalized) {
        const aliasRows = await db
          .select({ glossaryTermId: glossaryAliases.glossaryTermId })
          .from(glossaryAliases)
          .where(or(
            like(glossaryAliases.alias, `%${opts.filters?.search}%`),
            like(glossaryAliases.aliasNormalized, `%${searchNormalized}%`),
          ))
          .all()
        aliasTermIds = [...new Set(aliasRows.map(row => row.glossaryTermId))]
      }

      const searchWhere = aliasTermIds.length
        ? mergeConditions(
            ...applyPublishedScope(glossaryTerms, {
              scope: opts.isAuthenticated ? 'admin' : 'public',
            }),
            opts.filters?.kind ? eq(glossaryTerms.kind, opts.filters.kind) : undefined,
            localeFilter(glossaryTerms, opts.filters?.locale),
            statusFilter(glossaryTerms, opts.filters?.status),
            opts.filters?.rootsOnly ? isNull(glossaryTerms.parentId) : undefined,
            or(
              like(glossaryTerms.name, `%${opts.filters?.search}%`),
              like(glossaryTerms.slug, `%${opts.filters?.search}%`),
              like(glossaryTerms.sortKey, `%${searchNormalized}%`),
              inArray(glossaryTerms.id, aliasTermIds),
            ),
          )
        : where

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(glossaryTerms)
        .where(searchWhere)
        .all()
      const total = countResult[0]?.count ?? 0

      const idRows = await db
        .select({ id: glossaryTerms.id })
        .from(glossaryTerms)
        .where(searchWhere)
        .orderBy(glossaryTerms.sortKey, glossaryTerms.name)
        .limit(opts.pagination.limit)
        .offset(opts.pagination.offset)
        .all()

      const ids = idRows.map(row => row.id)
      if (ids.length === 0) {
        return paginateResult([], total, opts.pagination.page, opts.pagination.pageSize)
      }

      let fetchIds = ids
      if (opts.filters?.expandFamily && ids.length) {
        const matched = await db
          .select({ id: glossaryTerms.id, parentId: glossaryTerms.parentId })
          .from(glossaryTerms)
          .where(inArray(glossaryTerms.id, ids))
          .all()
        const roots = [...new Set(matched.map(row => row.parentId ?? row.id))]
        const familyRows = await db
          .select({ id: glossaryTerms.id })
          .from(glossaryTerms)
          .where(mergeConditions(
            ...publishedScopeFilter(opts.isAuthenticated),
            opts.filters.kind ? eq(glossaryTerms.kind, opts.filters.kind) : undefined,
            localeFilter(glossaryTerms, opts.filters.locale),
            or(
              inArray(glossaryTerms.id, roots),
              inArray(glossaryTerms.parentId, roots),
            ),
          ))
          .all()
        const seen = new Set(ids)
        fetchIds = [...ids]
        for (const row of familyRows) {
          if (!seen.has(row.id)) {
            seen.add(row.id)
            fetchIds.push(row.id)
          }
        }
      }

      const rows = reorderByIds(
        await db.query.glossaryTerms.findMany({
          where: { id: { in: fetchIds } },
          with: buildGlossaryWith(opts.include),
        }),
        fetchIds,
      )

      return paginateResult(rows, total, opts.pagination.page, opts.pagination.pageSize)
    },

    findById(id: number, include: string[] = [], scope: 'public' | 'admin' = 'public') {
      const filters: NonNullable<GlossaryQueryFilter>[] = [{ id }]
      if (scope !== 'admin') {
        filters.push({ status: 'published' }, { deletedAt: { isNull: true } })
      }
      else {
        filters.push({ deletedAt: { isNull: true } })
      }

      return db.query.glossaryTerms.findFirst({
        where: filters.length === 1 ? filters[0] : { AND: filters },
        with: buildGlossaryWith(include.length ? include : ['cover', 'seo', 'aliases', 'relatedArticle']),
      })
    },

    findRowById(id: number) {
      return db
        .select()
        .from(glossaryTerms)
        .where(and(eq(glossaryTerms.id, id), isNull(glossaryTerms.deletedAt)))
        .get()
    },

    findBySlug(slug: string, locale = 'fr', scope: 'public' | 'admin' = 'public') {
      const filters: NonNullable<GlossaryQueryFilter>[] = [{ slug }, { locale }]
      if (scope !== 'admin') {
        filters.push({ status: 'published' }, { deletedAt: { isNull: true } })
      }
      else {
        filters.push({ deletedAt: { isNull: true } })
      }
      return db.query.glossaryTerms.findFirst({
        where: { AND: filters },
        with: { cover: true, seo: true, aliases: true, relatedArticle: true, parent: true },
      })
    },

    async countForms(parentId: number) {
      const row = await db
        .select({ count: sql<number>`count(*)` })
        .from(glossaryTerms)
        .where(and(
          eq(glossaryTerms.parentId, parentId),
          isNull(glossaryTerms.deletedAt),
        ))
        .get()
      return row?.count ?? 0
    },

    async listFamilyMembers(termId: number, parentId: number | null, opts?: {
      publishedOnly?: boolean
    }) {
      const rootId = parentId ?? termId
      const rows = await db
        .select()
        .from(glossaryTerms)
        .where(mergeConditions(
          isNull(glossaryTerms.deletedAt),
          opts?.publishedOnly ? eq(glossaryTerms.status, 'published') : undefined,
          or(
            eq(glossaryTerms.id, rootId),
            eq(glossaryTerms.parentId, rootId),
          ),
        ))
        .orderBy(glossaryTerms.sortKey, glossaryTerms.name)
        .all()
      return rows.filter(row => row.id !== termId)
    },

    findBySortKey(kind: GlossaryKind, sortKey: string, locale = 'fr') {
      return db
        .select()
        .from(glossaryTerms)
        .where(and(
          eq(glossaryTerms.kind, kind),
          eq(glossaryTerms.sortKey, sortKey),
          eq(glossaryTerms.locale, locale),
          isNull(glossaryTerms.deletedAt),
        ))
        .get()
    },

    findRowsBySortKey(sortKey: string, locale = 'fr') {
      return db
        .select()
        .from(glossaryTerms)
        .where(and(
          eq(glossaryTerms.sortKey, sortKey),
          eq(glossaryTerms.locale, locale),
          isNull(glossaryTerms.deletedAt),
        ))
        .all()
    },

    findByNormalizedAlias(aliasNormalized: string, locale = 'fr') {
      return db
        .select({ term: glossaryTerms })
        .from(glossaryAliases)
        .innerJoin(glossaryTerms, eq(glossaryAliases.glossaryTermId, glossaryTerms.id))
        .where(and(
          eq(glossaryAliases.aliasNormalized, aliasNormalized),
          eq(glossaryAliases.locale, locale),
          isNull(glossaryTerms.deletedAt),
        ))
        .get()
        .then(row => row?.term ?? null)
    },

    async listLinkedRecipes(termId: number, limit = 24) {
      const ingredientRows = await db
        .select({
          id: schema.recipes.id,
          title: schema.recipes.title,
          slug: schema.recipes.slug,
        })
        .from(schema.ingredients)
        .innerJoin(schema.recipes, eq(schema.ingredients.recipeId, schema.recipes.id))
        .where(and(
          eq(schema.ingredients.glossaryTermId, termId),
          eq(schema.recipes.status, 'published'),
          isNull(schema.recipes.deletedAt),
        ))
        .limit(limit)
        .all()

      const utensilRows = await db
        .select({
          id: schema.recipes.id,
          title: schema.recipes.title,
          slug: schema.recipes.slug,
        })
        .from(schema.recipeUtensils)
        .innerJoin(schema.recipes, eq(schema.recipeUtensils.recipeId, schema.recipes.id))
        .where(and(
          eq(schema.recipeUtensils.glossaryTermId, termId),
          eq(schema.recipes.status, 'published'),
          isNull(schema.recipes.deletedAt),
        ))
        .limit(limit)
        .all()

      const seen = new Set<number>()
      const rows = [...ingredientRows, ...utensilRows].filter((row) => {
        if (seen.has(row.id)) return false
        seen.add(row.id)
        return true
      })
      return rows
    },

    async reserveUniqueSlug(baseSlug: string, locale: string) {
      return reserveUniqueSlugInLocale(baseSlug, locale, async (slug, loc) => {
        const existing = await db
          .select({ id: glossaryTerms.id })
          .from(glossaryTerms)
          .where(and(
            eq(glossaryTerms.slug, slug),
            eq(glossaryTerms.locale, loc),
            isNull(glossaryTerms.deletedAt),
          ))
          .get()
        return existing !== undefined
      })
    },

    insert(values: GlossaryTermInsert) {
      return db.insert(glossaryTerms).values(values).returning().get()
    },

    updateById(id: number, updates: GlossaryTermUpdate) {
      return db.update(glossaryTerms).set(updates).where(eq(glossaryTerms.id, id)).returning().get()
    },

    softDelete(id: number) {
      const now = new Date().toISOString()
      return db.update(glossaryTerms).set({
        deletedAt: now,
        updatedAt: now,
      }).where(eq(glossaryTerms.id, id))
    },

    async replaceAliases(termId: number, aliases: Array<{ alias: string, aliasNormalized: string, locale: string }>) {
      const statements: BatchItem<'sqlite'>[] = [
        db.delete(glossaryAliases).where(eq(glossaryAliases.glossaryTermId, termId)),
      ]
      if (aliases.length) {
        statements.push(db.insert(glossaryAliases).values(
          aliases.map(row => ({
            glossaryTermId: termId,
            alias: row.alias,
            aliasNormalized: row.aliasNormalized,
            locale: row.locale,
          })),
        ))
      }
      await db.batch(statements)
    },

    insertSeoNoindex(termId: number) {
      return db.insert(schema.seo).values({
        glossaryTermId: termId,
        metaRobots: 'noindex,follow',
      }).returning().get()
    },

    /**
     * Link a known culinary form to its family root. Sets `parentId` only —
     * never copies `coverBlobPathname` / alt / description from the root.
     */
    async attachKnownIngredientFamily(term: GlossaryTermRow): Promise<{
      term: GlossaryTermRow
      rootCreated: boolean
      linked: boolean
    }> {
      if (term.kind !== 'ingredient' || term.parentId != null) {
        return { term, rootCreated: false, linked: false }
      }

      const rootName = knownIngredientFamilyRootName(term.sortKey)
      if (!rootName) {
        return { term, rootCreated: false, linked: false }
      }

      const childCount = await this.countForms(term.id)
      if (childCount > 0) {
        return { term, rootCreated: false, linked: false }
      }

      const locale = term.locale || 'fr'
      const existingRoot = await this.findBySortKey('ingredient', glossarySortKey(rootName), locale)
      let root = existingRoot
      let rootCreated = false
      if (!root) {
        const stub = await this.findOrCreateStub({
          kind: 'ingredient',
          name: rootName,
          locale,
        })
        root = stub.term
        rootCreated = stub.created
      }

      if (!root || root.id === term.id || root.parentId != null) {
        return { term, rootCreated, linked: false }
      }

      const now = new Date().toISOString()
      const updated = await this.updateById(term.id, {
        parentId: root.id,
        updatedAt: now,
      })
      return {
        term: updated ?? { ...term, parentId: root.id, updatedAt: now },
        rootCreated,
        linked: true,
      }
    },

    async backfillKnownIngredientFamilies(locale = 'fr'): Promise<GlossaryFamilyBackfillStats> {
      const stats: GlossaryFamilyBackfillStats = {
        rootsCreated: 0,
        formsLinked: 0,
        skipped: 0,
      }
      const rows = await db
        .select()
        .from(glossaryTerms)
        .where(and(
          eq(glossaryTerms.kind, 'ingredient'),
          eq(glossaryTerms.locale, locale),
          isNull(glossaryTerms.deletedAt),
        ))
        .all()

      const byCatalogKey = new Map<string, GlossaryTermRow>()
      for (const row of rows) {
        byCatalogKey.set(normalizeGlossaryCatalogKey(row.sortKey), row)
      }

      const seen = new Set<number>()
      for (const family of GLOSSARY_INGREDIENT_FORM_FAMILIES) {
        for (const formName of family.forms) {
          const row = byCatalogKey.get(normalizeGlossaryCatalogKey(formName))
          if (!row || seen.has(row.id)) {
            continue
          }
          seen.add(row.id)
          const result = await this.attachKnownIngredientFamily(row)
          if (result.rootCreated) stats.rootsCreated += 1
          if (result.linked) stats.formsLinked += 1
          else stats.skipped += 1
        }
      }

      return stats
    },

    async findOrCreateStub(opts: {
      kind: GlossaryKind
      name: string
      locale?: string
      iconKey?: string | null
    }) {
      const locale = opts.locale || 'fr'
      const parsed = parseIngredientDisplayName(opts.name)
      if (!parsed.name) {
        throw new Error('Glossary stub name is empty')
      }

      const existing = await this.findBySortKey(opts.kind, parsed.sortKey, locale)
      if (existing) {
        const attached = await this.attachKnownIngredientFamily(existing)
        return { term: attached.term, created: false, note: parsed.note }
      }

      const byAlias = await this.findByNormalizedAlias(parsed.sortKey, locale)
      if (byAlias && byAlias.kind === opts.kind) {
        const attached = await this.attachKnownIngredientFamily(byAlias)
        return { term: attached.term, created: false, note: parsed.note }
      }

      const now = new Date().toISOString()
      const slug = await this.reserveUniqueSlug(glossaryTermSlugFromName(parsed.name), locale)
      const term = await this.insert({
        kind: opts.kind,
        name: parsed.name,
        slug,
        sortKey: parsed.sortKey,
        locale,
        status: 'draft',
        iconKey: opts.kind === 'ustensile' ? (opts.iconKey ?? null) : null,
        createdAt: now,
        updatedAt: now,
      })
      await this.insertSeoNoindex(term.id)
      const attached = await this.attachKnownIngredientFamily(term)
      return { term: attached.term, created: true, note: parsed.note }
    },
  }
}

export type { GlossaryUtensilCategory }
