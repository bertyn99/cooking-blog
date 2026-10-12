import { parseInclude } from '../../utils/populate'
import { createApiError } from '../../utils/errors'
import { useQueries } from '../../utils/db'
import { isPrivilegedContentRead } from '../../utils/preview-auth'
import { loadAmazonAffiliateTag, attachResolvedAffiliate } from '../../services/glossary-affiliate'
import { serializeGlossaryForScope, serializeGlossaryFamilyRef } from '../../utils/serialize-content'
import { glossarySiblingForms } from '../../../shared/glossary-family'
import { recipePublicPath } from '../../../shared/public-site-paths'

export default defineEventHandler(async (event) => {
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createApiError('NOT_FOUND', 'Terme de glossaire introuvable.')
  }

  const query = getQuery(event)
  const include = parseInclude(query as Record<string, unknown>)
  const isAuthenticated = await isPrivilegedContentRead(event)
  const scope = isAuthenticated ? 'admin' : 'public'
  const { glossary } = useQueries(event)
  const term = await glossary.findById(id, include, scope)

  if (!term) {
    throw createApiError('NOT_FOUND', 'Terme de glossaire introuvable.')
  }

  const amazonTag = await loadAmazonAffiliateTag(event)
  const recipes = await glossary.listLinkedRecipes(term.id)
  const members = await glossary.listFamilyMembers(term.id, term.parentId, {
    publishedOnly: scope === 'public',
  })

  return {
    ...serializeGlossaryForScope(
      attachResolvedAffiliate(term, amazonTag),
      scope,
    ),
    forms: glossarySiblingForms(members, term)
      .map(member => serializeGlossaryFamilyRef(member))
      .filter((member): member is NonNullable<typeof member> => member != null),
    recipes: recipes.map(recipe => ({
      ...recipe,
      path: recipePublicPath(recipe.slug),
    })),
  }
})
