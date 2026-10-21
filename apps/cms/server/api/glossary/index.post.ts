import { validateBody } from '../../utils/validate'
import { requireWriteActor } from '../../utils/write-auth'
import { createGlossaryTermSchema } from '../../utils/validations/glossary'
import { createGlossaryTermMutation } from '../../services/glossary-mutations'
import { useQueries } from '../../utils/db'
import { loadAmazonAffiliateTag, attachResolvedAffiliate } from '../../services/glossary-affiliate'
import { serializeGlossaryForScope } from '../../utils/serialize-content'
import { createApiError } from '../../utils/errors'
import { defineEventHandler, readBody, setResponseStatus } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  const actor = await requireWriteActor(event, 'glossary')
  const data = validateBody(createGlossaryTermSchema, await readBody(event))
  const created = await createGlossaryTermMutation(event, actor, data)
  if (!created) {
    throw createApiError('INTERNAL_ERROR', 'Impossible de créer le terme.')
  }
  const row = await useQueries(event).glossary.findById(created.id, ['cover', 'seo', 'aliases', 'relatedArticle'], 'admin')
  const amazonTag = await loadAmazonAffiliateTag(event)
  setResponseStatus(event, 201)
  return serializeGlossaryForScope(
    attachResolvedAffiliate(row ?? created, amazonTag),
    'admin',
  )
})
