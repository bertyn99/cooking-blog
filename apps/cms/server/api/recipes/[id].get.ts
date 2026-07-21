import { createRecipeQueries } from '../../db/queries/recipes'
import { parseInclude } from '../../utils/populate'
import { createApiError } from '../../utils/errors'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createApiError('NOT_FOUND', 'Recipe not found')
  }

  const query = getQuery(event)
  const include = parseInclude(query as Record<string, unknown>)
  const db = useDb(event)
  const session = await getUserSession(event)
  const scope = session.user ? 'admin' : 'public'
  const recipe = await createRecipeQueries(db).findById(id, scope, include)

  if (!recipe) {
    throw createApiError('NOT_FOUND', 'Recipe not found')
  }

  return recipe
})
