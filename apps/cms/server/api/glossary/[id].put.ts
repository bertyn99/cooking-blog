import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { requireWriteActor } from '../../utils/write-auth'
import { updateGlossaryTermSchema } from '../../utils/validations/glossary'
import { updateGlossaryTermMutation } from '../../services/glossary-mutations'
import { useQueries } from '../../utils/db'
import { loadAmazonAffiliateTag, attachResolvedAffiliate } from '../../services/glossary-affiliate'
import { serializeGlossaryForScope } from '../../utils/serialize-content'

export default defineEventHandler(async (event) => {
  const actor = await requireWriteActor(event, 'glossary')
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createApiError('NOT_FOUND', 'Terme de glossaire introuvable.')
  }

  const data = validateBody(updateGlossaryTermSchema, await readBody(event))
  await updateGlossaryTermMutation(event, actor, id, data)
  const row = await useQueries(event).glossary.findById(id, ['cover', 'seo', 'aliases', 'relatedArticle'], 'admin')
  if (!row) {
    throw createApiError('NOT_FOUND', 'Terme de glossaire introuvable.')
  }
  const amazonTag = await loadAmazonAffiliateTag(event)
  return {
    data: serializeGlossaryForScope(
      attachResolvedAffiliate(row, amazonTag),
      'admin',
    ),
  }
})
