import type { H3Event } from 'h3'
import {
  absolutePublicUrl,
  articlePublicPath,
  pagePublicPath,
  recipePublicPath,
  type NestedPageParent,
} from '../../../shared/public-site-paths'
import { withWritable, type WritableOptions } from './payload'

export type McpPreviewKind = 'article' | 'page' | 'recipe'

export interface McpContentLinkInput {
  siteOrigin: string
  kind: McpPreviewKind
  slug: string
  status: string
  categorySlug?: string | null
  parent?: NestedPageParent | null
}

export interface McpContentLinks {
  previewUrl: string
  publicUrl: string | null
}

export function siteOriginFromEvent(event: H3Event): string {
  const config = useRuntimeConfig(event)
  return String(config.public.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
}

export function buildMcpContentLinks(input: McpContentLinkInput): McpContentLinks {
  const origin = input.siteOrigin.replace(/\/$/, '')
  let publicPath: string
  let previewSlug: string

  switch (input.kind) {
    case 'article': {
      const category = input.categorySlug?.trim() || 'uncategorized'
      publicPath = articlePublicPath(input.slug, category)
      previewSlug = `${category}/${input.slug}`
      break
    }
    case 'page': {
      publicPath = pagePublicPath(input.slug, input.parent)
      previewSlug = publicPath.replace(/^\//, '')
      break
    }
    case 'recipe': {
      publicPath = recipePublicPath(input.slug)
      previewSlug = input.slug
      break
    }
    default: {
      const _exhaustive: never = input.kind
      throw new Error(`Unhandled preview kind: ${_exhaustive}`)
    }
  }

  const previewUrl = `${origin}/preview?type=${encodeURIComponent(input.kind)}&slug=${encodeURIComponent(previewSlug)}`
  const publicUrl = input.status === 'published'
    ? absolutePublicUrl(origin, publicPath)
    : null

  return { previewUrl, publicUrl }
}

export function withMcpContentLinks<T extends {
  slug: string
  status: string
  category?: { slug?: string } | null
  parent?: NestedPageParent | null
}>(
  event: H3Event,
  kind: McpPreviewKind,
  row: T,
  opts?: WritableOptions,
) {
  return {
    ...withWritable(row, opts),
    ...buildMcpContentLinks({
      siteOrigin: siteOriginFromEvent(event),
      kind,
      slug: row.slug,
      status: row.status,
      categorySlug: row.category?.slug,
      parent: row.parent ?? null,
    }),
  }
}

export function mapMcpList<T extends {
  slug: string
  status: string
  category?: { slug?: string } | null
  parent?: NestedPageParent | null
}>(
  event: H3Event,
  kind: McpPreviewKind,
  result: { data: T[], meta: unknown },
  opts?: WritableOptions,
) {
  return {
    ...result,
    data: result.data.map(row => withMcpContentLinks(event, kind, row, opts)),
  }
}
