export type ContentStatus = 'draft' | 'published' | 'scheduled'

export interface SafeUser {
  id: number
  email: string
  username: string | null
  role: 'admin' | 'editor'
  createdAt: string
  updatedAt: string
}

export interface PaginationMeta {
  page: number
  pageSize: number
  pageCount: number
  total: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    pagination: PaginationMeta
  }
}

export interface Article {
  id: number
  title: string
  slug: string
  status: ContentStatus
  locale: string
  publishedAt: string | null
  updatedAt: string
}

export interface Recipe {
  id: number
  title: string
  slug: string
  status: ContentStatus
  locale: string
  publishedAt: string | null
  updatedAt: string
}

export interface Page {
  id: number
  title: string
  slug: string
  status: ContentStatus
  locale: string
  publishedAt: string | null
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  slug: string
  type: string
}

export interface MediaItem {
  pathname: string
  contentType: string
  size: number
  uploadedAt: string
}
