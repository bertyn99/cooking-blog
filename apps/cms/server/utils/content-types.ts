export type PublishableContentType =
  | 'articles'
  | 'recipes'
  | 'pages'
  | 'categories'
  | 'category-articles'

export const PUBLISHABLE_CONTENT_TYPES = [
  'articles',
  'recipes',
  'pages',
  'categories',
  'category-articles',
] as const satisfies readonly PublishableContentType[]

export function isPublishableContentType(value: string): value is PublishableContentType {
  return (PUBLISHABLE_CONTENT_TYPES as readonly string[]).includes(value)
}
