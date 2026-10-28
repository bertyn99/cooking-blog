/**
 * Recipe origin vocabulary — the "cuisine tradition" of a recipe.
 *
 * A recipe can have SEVERAL origins (e.g. "curry japonais" is both
 * Indienne and Japonaise), so `recipes.origin` stores an array of
 * `{ country, continent }` pairs. `recipeCuisine` in Recipe schema.org
 * maps each origin to its country label.
 *
 * Country labels use French adjective form as used in recipe titles
 * ("Cuisine indienne"). Adding a country = adding a line here; new
 * countries never require a DB change (schema validates country as a
 * curated-but-open string, continent as a closed enum).
 */

export interface RecipeOrigin {
  country: string
  continent: string
}

export const RECIPE_ORIGIN_CONTINENTS = [
  { key: 'europe', label: 'Europe' },
  { key: 'asie', label: 'Asie' },
  { key: 'afrique', label: 'Afrique' },
  { key: 'moyen-orient', label: 'Moyen-Orient' },
  { key: 'amerique-du-nord', label: 'Amérique du Nord' },
  { key: 'amerique-latine', label: 'Amérique latine' },
  { key: 'oceanie', label: 'Océanie' },
] as const

export type RecipeOriginContinent = (typeof RECIPE_ORIGIN_CONTINENTS)[number]['key']

export const RECIPE_ORIGIN_CONTINENT_KEYS = ['europe', 'asie', 'afrique', 'moyen-orient', 'amerique-du-nord', 'amerique-latine', 'oceanie'] as const satisfies readonly RecipeOriginContinent[]

export const RECIPE_ORIGIN_COUNTRY_OPTIONS = [
  { key: 'francaise', label: 'Française', continent: 'europe' },
  { key: 'italienne', label: 'Italienne', continent: 'europe' },
  { key: 'espagnole', label: 'Espagnole', continent: 'europe' },
  { key: 'portugaise', label: 'Portugaise', continent: 'europe' },
  { key: 'belge', label: 'Belge', continent: 'europe' },
  { key: 'greque', label: 'Grecque', continent: 'europe' },
  { key: 'indienne', label: 'Indienne', continent: 'asie' },
  { key: 'japonaise', label: 'Japonaise', continent: 'asie' },
  { key: 'chinoise', label: 'Chinoise', continent: 'asie' },
  { key: 'coreenne', label: 'Coréenne', continent: 'asie' },
  { key: 'vietnamienne', label: 'Vietnamienne', continent: 'asie' },
  { key: 'thailandaise', label: 'Thaïlandaise', continent: 'asie' },
  { key: 'taiwanaise', label: 'Taïwanaise', continent: 'asie' },
  { key: 'indonesienne', label: 'Indonésienne', continent: 'asie' },
  { key: 'marocaine', label: 'Marocaine', continent: 'afrique' },
  { key: 'tunisienne', label: 'Tunisienne', continent: 'afrique' },
  { key: 'algerienne', label: 'Algérienne', continent: 'afrique' },
  { key: 'senegalaise', label: 'Sénégalaise', continent: 'afrique' },
  { key: 'ivoirienne', label: 'Ivoirienne', continent: 'afrique' },
  { key: 'camerounaise', label: 'Camerounaise', continent: 'afrique' },
  { key: 'ethiopienne', label: 'Éthiopienne', continent: 'afrique' },
  { key: 'libanaise', label: 'Libanaise', continent: 'moyen-orient' },
  { key: 'turque', label: 'Turque', continent: 'moyen-orient' },
  { key: 'israelienne', label: 'Israélienne', continent: 'moyen-orient' },
  { key: 'americaine', label: 'Américaine', continent: 'amerique-du-nord' },
  { key: 'mexicaine', label: 'Mexicaine', continent: 'amerique-latine' },
  { key: 'bresilienne', label: 'Brésilienne', continent: 'amerique-latine' },
] as const

export type RecipeOriginCountry = (typeof RECIPE_ORIGIN_COUNTRY_OPTIONS)[number]['key']

/** Normalized label for a stored country key ("italienne" → "Italienne"). */
export function recipeOriginCountryLabel(country: string): string {
  const found = (RECIPE_ORIGIN_COUNTRY_OPTIONS as readonly { key: string, label: string }[])
    .find(option => option.key === country)
  if (found) return found.label
  return country.charAt(0).toUpperCase() + country.slice(1)
}

/** Continent implied by a known country key; null for custom keys. */
export function recipeOriginCountryContinent(country: string): RecipeOriginContinent | null {
  const found = (RECIPE_ORIGIN_COUNTRY_OPTIONS as readonly { key: string, continent: string }[])
    .find(option => option.key === country)
  return (found?.continent as RecipeOriginContinent | undefined) ?? null
}

export function recipeOriginContinentLabel(continent: string): string {
  const found = (RECIPE_ORIGIN_CONTINENTS as readonly { key: string, label: string }[])
    .find(option => option.key === continent)
  return found?.label ?? continent
}

/** Cuisine labels for Recipe schema.org `recipeCuisine` — e.g. ["Indienne", "Japonaise"]. */
export function recipeOriginCuisineLabels(origins: RecipeOrigin[] | null | undefined): string[] {
  if (!Array.isArray(origins)) return []
  const labels = origins
    .filter(origin => origin && typeof origin.country === 'string' && origin.country)
    .map(origin => recipeOriginCountryLabel(origin.country))
  return [...new Set(labels)].sort((a, b) => a.localeCompare(b, 'fr'))
}

/** Recipe schema.org `recipeCuisine` value (Text — single string per schema.org range). */
export function recipeOriginCuisineText(origins: RecipeOrigin[] | null | undefined): string | undefined {
  const labels = recipeOriginCuisineLabels(origins)
  return labels.length ? labels.join(', ') : undefined
}
