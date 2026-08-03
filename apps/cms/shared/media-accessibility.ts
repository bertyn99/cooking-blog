import type { MediaFileMetadata } from './media-file-metadata'

export function blobDefaultDescription(metadata?: MediaFileMetadata | null): string | undefined {
  const description = metadata?.description?.trim()
  if (description) {
    return description
  }
  const caption = metadata?.caption?.trim()
  return caption || undefined
}

/** `altOverride` null/undefined → use blob alt, then optional title fallback. */
export function resolveCoverAlt(opts: {
  altOverride?: string | null
  blobAlt?: string | null
  titleFallback?: string
}): string | undefined {
  if (opts.altOverride != null) {
    return opts.altOverride.trim()
  }
  const blobAlt = opts.blobAlt?.trim()
  if (blobAlt) {
    return blobAlt
  }
  const title = opts.titleFallback?.trim()
  return title || undefined
}

/** `descriptionOverride` null/undefined → use blob description/caption (Strapi import). */
export function resolveCoverDescription(opts: {
  descriptionOverride?: string | null
  metadata?: MediaFileMetadata | null
}): string | undefined {
  if (opts.descriptionOverride != null) {
    const trimmed = opts.descriptionOverride.trim()
    return trimmed || undefined
  }
  return blobDefaultDescription(opts.metadata)
}

export interface BlobCoverSource {
  pathname: string
  originalName?: string | null
  mimeType?: string | null
  size?: number | null
  width?: number | null
  height?: number | null
  altText?: string | null
  fileMetadata?: MediaFileMetadata | null
}

/** Shape expected by the public Nuxt site (`Cover` in strapiMeta). */
export interface StrapiLikeCover {
  name?: string
  alternativeText?: string
  caption?: string
  width?: number
  height?: number
  hash?: string
  ext?: string
  mime?: string
  size?: number
  url?: string
}

export function blobToStrapiCover(
  blob: BlobCoverSource,
  opts?: {
    altOverride?: string | null
    descriptionOverride?: string | null
    titleFallback?: string
  },
): StrapiLikeCover {
  const fileName = blob.pathname.split('/').pop() ?? 'image'
  const dot = fileName.lastIndexOf('.')
  const hash = dot > 0 ? fileName.slice(0, dot) : fileName
  const ext = dot > 0 ? fileName.slice(dot) : ''
  const assetPath = blob.pathname.startsWith('uploads/')
    ? blob.pathname
    : `uploads/${blob.pathname}`

  return {
    name: blob.originalName ?? fileName,
    alternativeText: resolveCoverAlt({
      altOverride: opts?.altOverride,
      blobAlt: blob.altText,
      titleFallback: opts?.titleFallback,
    }),
    caption: resolveCoverDescription({
      descriptionOverride: opts?.descriptionOverride,
      metadata: blob.fileMetadata,
    }),
    width: blob.width ?? undefined,
    height: blob.height ?? undefined,
    hash,
    ext,
    mime: blob.mimeType ?? undefined,
    size: blob.size ?? undefined,
    url: `/${assetPath}`,
  }
}
