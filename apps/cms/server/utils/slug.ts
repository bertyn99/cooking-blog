import { slugifyString } from '../../shared/slug'

export { slugifyString }

/**
 * Generate a unique slug by checking for collisions and appending suffix.
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
