import { blobToStrapiCover, type StrapiLikeCover } from '../../shared/media-accessibility'
import type { MediaFileMetadata } from '../../shared/media-file-metadata'

type CoverBlob = {
  pathname: string
  originalName?: string | null
  mimeType?: string | null
  size?: number | null
  width?: number | null
  height?: number | null
  altText?: string | null
  fileMetadata?: MediaFileMetadata | null
}

type ArticleLike = {
  title: string
  coverBlobPathname?: string | null
  coverAltText?: string | null
  coverDescription?: string | null
  cover?: CoverBlob | null
}

type RecipeLike = ArticleLike

function coverBlobFromPathname(pathname: string): CoverBlob {
  const fileName = pathname.split('/').pop() ?? 'image'
  return {
    pathname: pathname.startsWith('uploads/') ? pathname : `uploads/${pathname}`,
    originalName: fileName,
  }
}

function serializeCover<T extends ArticleLike | RecipeLike>(
  row: T,
): Omit<T, 'cover' | 'coverAltText' | 'coverDescription'> & { cover: StrapiLikeCover | null } {
  const { coverAltText, coverDescription, cover, coverBlobPathname, ...rest } = row
  const resolvedCover =
    cover ?? (coverBlobPathname ? coverBlobFromPathname(coverBlobPathname) : null)
  return {
    ...rest,
    cover: resolvedCover
      ? blobToStrapiCover(resolvedCover, {
          altOverride: coverAltText,
          descriptionOverride: coverDescription,
          titleFallback: row.title,
        })
      : null,
  }
}

export function serializeArticleForScope<T extends ArticleLike>(
  article: T,
  scope: 'public' | 'admin',
): T {
  if (scope === 'admin') {
    return article
  }
  return serializeCover(article) as T
}

export function serializeRecipeForScope<T extends RecipeLike>(
  recipe: T,
  scope: 'public' | 'admin',
): T {
  if (scope === 'admin') {
    return recipe
  }
  return serializeCover(recipe) as T
}
