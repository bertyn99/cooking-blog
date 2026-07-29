export async function reserveUniqueSlugInLocale(
  baseSlug: string,
  locale: string,
  slugTaken: (slug: string, locale: string) => Promise<boolean>,
): Promise<string> {
  let slug = baseSlug
  let counter = 2
  while (await slugTaken(slug, locale)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  return slug
}
