import { useContentGenerationService } from '../../../services/generation/service'
import { createContentGenerationQueries } from '../../../db/queries/content-generation'
import { requireEditor } from '../../../utils/http-auth'
import { serializeGenerationRunForApi } from '../../../utils/serialize-generation-run'
import { useDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)
  const query = getQuery(event)
  const status = typeof query.status === 'string' ? query.status : undefined
  const excludeMine = query.excludeMine === '1' || query.excludeMine === 'true'
  const limit = Math.min(Number(query.limit) || 50, 100)
  const articleId = query.articleId ? Number(query.articleId) : null
  const recipeId = query.recipeId ? Number(query.recipeId) : null

  const service = useContentGenerationService(event)
  const queries = createContentGenerationQueries(useDb(event))

  if (articleId && Number.isFinite(articleId)) {
    const runs = await queries.listForArticle(articleId)
    return {
      data: runs.slice(0, limit).map(run => serializeGenerationRunForApi(run as Record<string, unknown>)),
      meta: { count: runs.length, status: status ?? 'any' },
    }
  }

  if (recipeId && Number.isFinite(recipeId)) {
    const runs = await queries.listForRecipe(recipeId)
    return {
      data: runs.slice(0, limit).map(run => serializeGenerationRunForApi(run as Record<string, unknown>)),
      meta: { count: runs.length, status: status ?? 'any' },
    }
  }

  if (status === 'awaiting_review') {
    const runs = await service.listAwaitingReview({
      excludeRequestedByUserId: excludeMine ? session.user.id : null,
      limit,
    })
    const count = await service.countAwaitingReview(
      excludeMine ? session.user.id : null,
    )
    return {
      data: runs.map(run => serializeGenerationRunForApi(run as Record<string, unknown>)),
      meta: { count, status: 'awaiting_review' as const },
    }
  }

  const runs = await service.listAwaitingReview({
    excludeRequestedByUserId: session.user.id,
    limit,
  })
  const count = await service.countAwaitingReview(session.user.id)
  return {
    data: runs.map(run => serializeGenerationRunForApi(run as Record<string, unknown>)),
    meta: { count, status: 'awaiting_review' as const },
  }
})
