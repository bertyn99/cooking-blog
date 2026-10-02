export type ContentBlockListQuery = {
  source?: string
  category?: string
  slugs?: string
  limit?: string | number
}

export type ContentBlockListItem = {
  id: string | number
  title: string
  href?: string
  coverSrc?: string
  time?: string | number
  difficulty?: string
  category?: string
  description?: string
  readingMinutes?: number
}
