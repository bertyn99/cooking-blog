import { validateBody } from '../../utils/validate'
import { requireWriteActor } from '../../utils/write-auth'
import { bulkGlossaryTermsSchema } from '../../utils/validations/glossary'
import { bulkGlossaryTermsMutation } from '../../services/glossary-mutations'

export default defineEventHandler(async (event) => {
  const actor = await requireWriteActor(event, 'glossary')
  const data = validateBody(bulkGlossaryTermsSchema, await readBody(event))
  return bulkGlossaryTermsMutation(event, actor, data)
})
