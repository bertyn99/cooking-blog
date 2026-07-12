/**
 * Slugify a string: lowercase, hyphenated, accent-stripped for French.
 * Named slugifyString to avoid collision with client-side generateSlug.
 */
export function slugifyString(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (é->e, à->a, ç->c)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '') // Remove non-alphanumeric
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by checking for collisions and appending suffix.
 * This is a synchronous utility — the async DB check is done in the CRUD handler.
 * This function just generates the base slug.
 */
export function generateUniqueSlug(text: string, existingSlugs: string[] = []): string {
  let base = slugifyString(text)
  if (!base) base = 'untitled'

  let slug = base
  let counter = 2
  while (existingSlugs.includes(slug)) {
    slug = `${base}-${counter}`
    counter++
  }
  return slug
}
