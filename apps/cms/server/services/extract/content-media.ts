import type { ExtractContext, StrapiEntityStats } from './types'
import { importStrapiMediaByUploadPath } from './media'
import { getMediaUrl } from '../../utils/media'
import { canonicalStrapiUploadPath } from '../../utils/media-storage'
import {
  isEmptyOrGenericImageAlt,
  iterateMarkdownImages,
  pathnameFromContentImageSrc,
  serializeMarkdownImage,
} from '../../../shared/content-image'

/** `/uploads/...` paths (not already under `/images/uploads/…`) and absolute Strapi upload URLs. */
const UPLOAD_REF_PATTERN
  = /(?:https?:\/\/[^/\s"'<>]+)?(?<!\/images)(\/uploads\/[^\s"'<>)\]]+)/gi

/**
 * Public-site style paths that are NOT CMS media (`/images/uploads/…`).
 * Often leftover Nuxt Content placeholders that were never in Strapi media.
 * Example: `/images/aperitif-portugais/caldo-verde.jpg`
 */
const ORPHAN_PUBLIC_IMAGE_PATTERN
  = /(?:https?:\/\/[^/\s"'<>]+)?(\/images\/(?!uploads\/)[^\s"'<>)\]]+)/gi

export function extractUploadPathsFromText(text: string): string[] {
  const paths = new Set<string>()
  for (const match of text.matchAll(UPLOAD_REF_PATTERN)) {
    const uploadPath = match[1]
    if (uploadPath) paths.add(uploadPath)
  }
  return [...paths]
}

/** Non-upload `/images/…` refs that hydrate cannot import automatically. */
export function extractOrphanPublicImagePaths(text: string): string[] {
  const paths = new Set<string>()
  for (const match of text.matchAll(ORPHAN_PUBLIC_IMAGE_PATTERN)) {
    const path = match[1]
    if (path) paths.add(path)
  }
  return [...paths]
}

/**
 * When markdown image alt is empty/generic, use the media library alt (Strapi alternativeText).
 */
export async function fillMarkdownImageAltsFromCatalog(
  ctx: ExtractContext,
  text: string,
): Promise<string> {
  const images = iterateMarkdownImages(text)
  if (!images.length) {
    return text
  }

  let output = text
  // Replace from the end so indices stay valid.
  for (let i = images.length - 1; i >= 0; i--) {
    const image = images[i]!
    if (!isEmptyOrGenericImageAlt(image.alt)) {
      continue
    }
    const pathname = pathnameFromContentImageSrc(image.src)
    if (!pathname) {
      continue
    }
    const blob = await ctx.queries.blobs.findByPathname(pathname)
    const fromMedia = blob?.altText?.trim()
    if (!fromMedia) {
      continue
    }
    const next = serializeMarkdownImage({
      alt: fromMedia,
      src: image.src,
      title: image.title,
    })
    output = output.slice(0, image.index) + next + output.slice(image.index + image.full.length)
  }

  return output
}

/**
 * Downloads Strapi upload files referenced in markdown/HTML and rewrites URLs to `/images/uploads/…`.
 * Then fills empty image alts from the media catalog.
 */
export async function rewriteStrapiUploadsInText(
  ctx: ExtractContext,
  text: string | null | undefined,
  stats: StrapiEntityStats,
  strapiBaseUrl: string,
): Promise<string | null> {
  if (!text) return text ?? null

  const base = strapiBaseUrl.replace(/\/$/, '')
  let output = text
  const variantsByCanonical = new Map<string, Set<string>>()

  for (const foundPath of extractUploadPathsFromText(text)) {
    const canonical = canonicalStrapiUploadPath(foundPath)
    const variants = variantsByCanonical.get(canonical) ?? new Set()
    variants.add(foundPath)
    variantsByCanonical.set(canonical, variants)
  }

  for (const [canonicalPath, variants] of variantsByCanonical) {
    const pathname = await importStrapiMediaByUploadPath(ctx, canonicalPath, stats)
    if (!pathname) continue

    const cmsUrl = getMediaUrl(pathname)
    for (const variant of variants) {
      output = output.split(variant).join(cmsUrl)
      output = output.split(`${base}${variant}`).join(cmsUrl)
    }
  }

  const orphans = extractOrphanPublicImagePaths(output)
  if (orphans.length) {
    ctx.log(
      `[media] ${orphans.length} image(s) hors /uploads (absentes de Strapi — à remplacer dans l’éditeur) : ${orphans.slice(0, 5).join(', ')}${orphans.length > 5 ? '…' : ''}`,
    )
  }

  return fillMarkdownImageAltsFromCatalog(ctx, output)
}
