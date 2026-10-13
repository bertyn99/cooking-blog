import type { H3Event } from 'h3'
import type { z } from 'zod'
import { useDb, useQueries } from '../utils/db'
import { createApiError, fromQueryError } from '../utils/errors'
import { authorshipOnCreate, authorshipOnUpdate } from '../utils/content-authorship'
import { applyContentPolicy } from '../utils/content-status-policy'
import type { Actor } from '../utils/actor'
import { actorApiKeyId, actorUserId } from '../utils/actor'
import { recordContentAudit } from './content-audit'
import { recordBulkAudit, runBulkPerId } from './content-bulk-mutations'
import { partitionBulkIds } from '../../shared/content-bulk'
import type { MutationMeta } from './article-mutations'
import type {
  createGlossaryTermSchema,
  updateGlossaryTermSchema,
  GlossaryBulkAction,
} from '../utils/validations/glossary'
import {
  glossarySortKey,
  glossaryTermSlugFromName,
  isGlossaryKind,
  parseIngredientDisplayName,
  type GlossaryKind,
} from '../../shared/glossary-normalize'
import {
  isGlossaryIconKey,
  parseGlossaryIconKey,
  type GlossaryUtensilCategory,
} from '../../shared/glossary-icons'
import { normalizeAmazonAsin } from '../../shared/glossary-affiliate'
import { aliasConflictsWithCulinaryForm } from '../../shared/glossary-form-families'
import { glossaryRobotsForStatus } from '../../shared/glossary-robots'

type CreateGlossaryInput = z.infer<typeof createGlossaryTermSchema>
type UpdateGlossaryInput = z.infer<typeof updateGlossaryTermSchema>

function assertKindFields(kind: GlossaryKind, data: {
  iconKey?: string | null
  utensilCategory?: string | null
  brand?: string | null
  amazonAsin?: string | null
  partnerUrl?: string | null
  partnerName?: string | null
}) {
  if (kind !== 'ustensile') {
    return {
      iconKey: null,
      utensilCategory: null,
      brand: null,
      amazonAsin: null,
      partnerUrl: null,
      partnerName: null,
    }
  }

  if (data.iconKey != null && data.iconKey !== '' && !isGlossaryIconKey(data.iconKey)) {
    throw createApiError('VALIDATION_ERROR', `Icône inconnue : ${data.iconKey}`)
  }

  return {
    iconKey: parseGlossaryIconKey(data.iconKey),
    utensilCategory: (data.utensilCategory ?? null) as GlossaryUtensilCategory | null,
    brand: data.brand?.trim() || null,
    amazonAsin: data.amazonAsin ? normalizeAmazonAsin(data.amazonAsin) : null,
    partnerUrl: data.partnerUrl?.trim() || null,
    partnerName: data.partnerName?.trim() || null,
  }
}

async function resolveParentId(
  glossary: ReturnType<typeof useQueries>['glossary'],
  opts: {
    kind: GlossaryKind
    parentId?: number | null
    termId?: number
  },
): Promise<number | null> {
  if (opts.kind !== 'ingredient') {
    return null
  }
  if (opts.parentId == null) {
    return null
  }
  if (opts.termId != null && opts.parentId === opts.termId) {
    throw createApiError('VALIDATION_ERROR', 'Un terme ne peut pas être sa propre forme.')
  }

  const parent = await glossary.findRowById(opts.parentId)
  if (!parent) {
    throw createApiError('NOT_FOUND', 'Fiche famille introuvable.')
  }
  if (parent.kind !== 'ingredient') {
    throw createApiError('VALIDATION_ERROR', 'La famille doit être un ingrédient.')
  }
  if (parent.parentId != null) {
    throw createApiError(
      'VALIDATION_ERROR',
      'La famille doit être la fiche racine (Amande), pas une forme (lait d’amande).',
    )
  }

  if (opts.termId != null) {
    const childCount = await glossary.countForms(opts.termId)
    if (childCount > 0) {
      throw createApiError(
        'VALIDATION_ERROR',
        'Une fiche qui a déjà des formes ne peut pas devenir elle-même une forme.',
      )
    }
  }

  return opts.parentId
}

function aliasesPayload(aliases: Array<{ alias: string, locale?: string }> | undefined, locale: string) {
  if (!aliases?.length) return []
  const seen = new Set<string>()
  const rows: Array<{ alias: string, aliasNormalized: string, locale: string } > = []
  for (const item of aliases) {
    const alias = item.alias.trim()
    if (!alias) continue
    const loc = item.locale || locale
    const aliasNormalized = glossarySortKey(alias)
    const key = `${loc}:${aliasNormalized}`
    if (!aliasNormalized || seen.has(key)) continue
    seen.add(key)
    rows.push({ alias, aliasNormalized, locale: loc })
  }
  return rows
}

export async function syncGlossaryRobotsForStatus(
  event: H3Event,
  termId: number,
  status: 'draft' | 'published',
) {
  const { seo } = useQueries(event)
  await seo.upsertForContent('glossary', termId, {
    metaRobots: glossaryRobotsForStatus(status),
  })
}

async function assertAliasesDoNotStealTerms(
  glossary: ReturnType<typeof useQueries>['glossary'],
  opts: {
    termId: number
    sortKey: string
    aliases: Array<{ alias: string, aliasNormalized: string, locale: string }>
  },
) {
  for (const row of opts.aliases) {
    if (row.aliasNormalized === opts.sortKey) continue
    if (aliasConflictsWithCulinaryForm(opts.sortKey, row.aliasNormalized)) {
      throw createApiError(
        'VALIDATION_ERROR',
        `« ${row.alias} » est une forme culinaire, pas un synonyme. Créez une fiche distincte.`,
      )
    }
    const collisions = await glossary.findRowsBySortKey(row.aliasNormalized, row.locale)
    const other = collisions.find(term => term.id !== opts.termId)
    if (other) {
      throw createApiError(
        'VALIDATION_ERROR',
        `« ${row.alias} » est déjà la fiche « ${other.name} ». Un alias ne peut pas remplacer une forme.`,
      )
    }
  }
}

export async function createGlossaryTermMutation(
  event: H3Event,
  actor: Actor,
  data: CreateGlossaryInput,
  meta?: MutationMeta,
) {
  const { glossary } = useQueries(event)
  const kind = data.kind
  if (!isGlossaryKind(kind)) {
    throw createApiError('VALIDATION_ERROR', 'Kind glossaire invalide.')
  }

  const statusPatch = applyContentPolicy(actor, null, { status: data.status })
  const status = actor.kind === 'apiKey'
    ? 'draft'
    : (statusPatch.status === 'published' ? 'published' : 'draft')

  const locale = data.locale || 'fr'
  const name = data.name.trim()
  const baseSlug = data.slug || glossaryTermSlugFromName(name)
  const slug = await glossary.reserveUniqueSlug(baseSlug, locale)
  const now = new Date().toISOString()
  const utensilFields = assertKindFields(kind, data)
  const parentId = await resolveParentId(glossary, { kind, parentId: data.parentId })
  const userId = actorUserId(actor)

  try {
    const result = await glossary.insert({
      kind,
      name,
      slug,
      description: data.description,
      content: data.content,
      coverBlobPathname: data.coverBlobPathname ?? null,
      coverAltText: data.coverAltText ?? null,
      coverDescription: data.coverDescription ?? null,
      relatedArticleId: data.relatedArticleId ?? null,
      parentId,
      sortKey: glossarySortKey(name),
      locale,
      status,
      publishedAt: status === 'published' ? now : null,
      ...utensilFields,
      ...authorshipOnCreate(userId),
    })

    await glossary.insertSeoNoindex(result.id)
    if (status === 'published') {
      await syncGlossaryRobotsForStatus(event, result.id, 'published')
    }
    const aliasRows = aliasesPayload(data.aliases, locale)
    if (aliasRows.length) {
      await assertAliasesDoNotStealTerms(glossary, {
        termId: result.id,
        sortKey: glossarySortKey(name),
        aliases: aliasRows,
      })
      await glossary.replaceAliases(result.id, aliasRows)
    }

    await recordContentAudit(useDb(event), {
      actorUserId: userId,
      actorApiKeyId: actorApiKeyId(actor),
      action: 'content.create',
      entityType: 'glossary',
      entityId: result.id,
      metadata: meta?.tool ? { tool: meta.tool } : null,
    })

    return result
  }
  catch (error) {
    fromQueryError(error)
  }
}

export async function updateGlossaryTermMutation(
  event: H3Event,
  actor: Actor,
  id: number,
  data: UpdateGlossaryInput,
  meta?: MutationMeta,
) {
  const { glossary } = useQueries(event)
  const existing = await glossary.findRowById(id)
  if (!existing) {
    throw createApiError('NOT_FOUND', 'Terme de glossaire introuvable.')
  }

  const kind = data.kind ?? existing.kind
  if (!isGlossaryKind(kind)) {
    throw createApiError('VALIDATION_ERROR', 'Kind glossaire invalide.')
  }

  const statusFields = applyContentPolicy(actor, {
    status: existing.status === 'published' ? 'published' : 'draft',
  }, {
    status: data.status,
  }, { apiKeyMode: 'in-place' })

  const locale = data.locale ?? existing.locale
  const name = data.name?.trim() ?? existing.name
  let slug = existing.slug
  if (data.slug && data.slug !== existing.slug) {
    slug = await glossary.reserveUniqueSlug(data.slug, locale)
  }
  else if (data.name && data.name !== existing.name && !data.slug) {
    slug = await glossary.reserveUniqueSlug(glossaryTermSlugFromName(name), locale)
  }

  const utensilFields = assertKindFields(kind, {
    iconKey: data.iconKey !== undefined ? data.iconKey : existing.iconKey,
    utensilCategory: data.utensilCategory !== undefined ? data.utensilCategory : existing.utensilCategory,
    brand: data.brand !== undefined ? data.brand : existing.brand,
    amazonAsin: data.amazonAsin !== undefined ? data.amazonAsin : existing.amazonAsin,
    partnerUrl: data.partnerUrl !== undefined ? data.partnerUrl : existing.partnerUrl,
    partnerName: data.partnerName !== undefined ? data.partnerName : existing.partnerName,
  })

  const parentId = data.parentId !== undefined
    ? await resolveParentId(glossary, { kind, parentId: data.parentId, termId: id })
    : (kind === 'ingredient' ? existing.parentId : null)

  const now = new Date().toISOString()
  const nextStatus = actor.kind === 'apiKey'
    ? existing.status
    : (statusFields.status === 'published' || data.status === 'published'
      ? 'published'
      : (data.status === 'draft' || statusFields.status === 'draft' ? (data.status ?? existing.status) : existing.status))

  const userId = actorUserId(actor)

  try {
    const result = await glossary.updateById(id, {
      kind,
      name,
      slug,
      description: data.description !== undefined ? data.description : existing.description,
      content: data.content !== undefined ? data.content : existing.content,
      coverBlobPathname: data.coverBlobPathname !== undefined ? data.coverBlobPathname : existing.coverBlobPathname,
      coverAltText: data.coverAltText !== undefined ? data.coverAltText : existing.coverAltText,
      coverDescription: data.coverDescription !== undefined ? data.coverDescription : existing.coverDescription,
      relatedArticleId: data.relatedArticleId !== undefined ? data.relatedArticleId : existing.relatedArticleId,
      parentId,
      sortKey: glossarySortKey(name),
      locale,
      status: nextStatus,
      publishedAt: nextStatus === 'published'
        ? (existing.publishedAt ?? now)
        : (nextStatus === 'draft' && existing.status === 'published' ? null : existing.publishedAt),
      ...utensilFields,
      ...authorshipOnUpdate(userId),
      updatedAt: now,
    })

    if (data.aliases) {
      const aliasRows = aliasesPayload(data.aliases, locale)
      await assertAliasesDoNotStealTerms(glossary, {
        termId: id,
        sortKey: glossarySortKey(name),
        aliases: aliasRows,
      })
      await glossary.replaceAliases(id, aliasRows)
    }

    if (nextStatus !== existing.status && (nextStatus === 'published' || existing.status === 'published')) {
      await syncGlossaryRobotsForStatus(
        event,
        id,
        nextStatus === 'published' ? 'published' : 'draft',
      )
    }

    await recordContentAudit(useDb(event), {
      actorUserId: userId,
      actorApiKeyId: actorApiKeyId(actor),
      action: 'content.update',
      entityType: 'glossary',
      entityId: id,
      metadata: meta?.tool ? { tool: meta.tool } : null,
    })

    return result
  }
  catch (error) {
    fromQueryError(error)
  }
}

export async function findOrCreateGlossaryStub(
  event: H3Event,
  actor: Actor,
  input: {
    kind: GlossaryKind
    name: string
    locale?: string
    iconKey?: string | null
  },
  meta?: MutationMeta,
) {
  const { glossary } = useQueries(event)
  const parsed = parseIngredientDisplayName(input.name)
  if (!parsed.name) {
    throw createApiError('VALIDATION_ERROR', 'Nom de terme glossaire manquant.')
  }

  const created = await glossary.findOrCreateStub({
    kind: input.kind,
    name: parsed.name,
    locale: input.locale,
    iconKey: input.iconKey && isGlossaryIconKey(input.iconKey) ? input.iconKey : null,
  })

  if (created.created) {
    await recordContentAudit(useDb(event), {
      actorUserId: actorUserId(actor),
      actorApiKeyId: actorApiKeyId(actor),
      action: 'content.create',
      entityType: 'glossary',
      entityId: created.term.id,
      metadata: { ...(meta?.tool ? { tool: meta.tool } : {}), stub: true },
    })
  }

  return created.term
}

export async function bulkGlossaryTermsMutation(
  event: H3Event,
  actor: Actor,
  input: { ids: number[], action: GlossaryBulkAction },
) {
  const { glossary } = useQueries(event)
  const uniqueIds = [...new Set(input.ids)]
  const rows = await glossary.findRowsByIds(uniqueIds)
  if (!rows.length) {
    throw createApiError('NOT_FOUND', 'Aucun terme de glossaire trouvé.')
  }

  const foundIds = rows.map(row => row.id)
  const { missingIds } = partitionBulkIds(uniqueIds, foundIds)
  const userId = actorUserId(actor)
  const now = new Date().toISOString()
  let failed: Array<{ id: number, message: string }> = []

  switch (input.action) {
    case 'delete':
      await glossary.softDeleteMany(foundIds, userId)
      break
    case 'publish':
      applyContentPolicy(actor, { status: 'draft' }, { status: 'published' })
      await glossary.publishByIds(foundIds, now, userId)
      failed = (await runBulkPerId(foundIds, id => syncGlossaryRobotsForStatus(event, id, 'published'))).failed
      break
    case 'unpublish':
      applyContentPolicy(actor, { status: 'published' }, { status: 'draft' })
      await glossary.unpublishByIds(foundIds, now, userId)
      failed = (await runBulkPerId(foundIds, id => syncGlossaryRobotsForStatus(event, id, 'draft'))).failed
      break
    default: {
      const _exhaustive: never = input.action
      throw createApiError('VALIDATION_ERROR', `Action inconnue : ${String(_exhaustive)}`)
    }
  }

  await recordBulkAudit(event, actor, 'glossary', foundIds, input.action, {
    ...(failed.length ? { failed } : {}),
    ...(missingIds.length ? { missingIds } : {}),
  })

  return {
    action: input.action,
    ids: foundIds,
    count: foundIds.length,
    ...(failed.length ? { failed } : {}),
    ...(missingIds.length ? { missingIds } : {}),
  }
}

export {
  createGlossaryTermSchema,
  updateGlossaryTermSchema,
} from '../utils/validations/glossary'
