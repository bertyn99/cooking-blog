import { validateBody } from '../../utils/validate'
import { requireWriteActor } from '../../utils/write-auth'
import {
  createRecipeMutation,
  createRecipeSchema,
} from '../../services/recipe-mutations'

export default defineEventHandler(async (event) => {
  const actor = await requireWriteActor(event, 'recipes')
  const data = validateBody(createRecipeSchema, await readBody(event))
  const result = await createRecipeMutation(event, actor, data)
  setResponseStatus(event, 201)
  return result
})
