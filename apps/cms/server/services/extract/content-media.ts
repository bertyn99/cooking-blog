import type { ExtractContext, StrapiEntityStats } from './types'
import { importStrapiMediaByUploadPath } from './media'
import { getMediaUrl } from '../../utils/media'
import { canonicalStrapiUploadPath } from '../../utils/media-storage'

/** `/uploads/...` paths (incl. Strapi image transforms) and absolute Strapi upload URLs. */
const UPLOAD_REF_PATTERN
  = /(?:https?:\/\/[^/\s"'<>]+)?(\/uploads\/[^\s"'<>)\]]+)/gi

export function extractUploadPathsFromText(text: string): string[] {
  const paths = new Set<string>()
  for (const match of text.matchAll(UPLOAD_REF_PATTERN)) {
    const uploadPath = match[1]
    if (uploadPath) paths.add(uploadPath)
  }
  return [...paths]
}

/**
 * Downloads Strapi upload files referenced in markdown/HTML and rewrites URLs to `/images/uploads/…`.
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
    const variants = variantsByCanonical.get(canonical) ?? new Set<string>()
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

  return output
}
