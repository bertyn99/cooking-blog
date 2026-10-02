import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { requireWriteActor } from '../../utils/write-auth'
import {
  updateRecipeMutation,
  updateRecipeSchema,
} from '../../services/recipe-mutations'

export default defineEventHandler(async (event) => {
  const actor = await requireWriteActor(event, 'recipes')

  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createApiError('NOT_FOUND', 'Recette introuvable.')
  }

  const data = validateBody(updateRecipeSchema, await readBody(event))
  return updateRecipeMutation(event, actor, id, data)
})
