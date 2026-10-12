import { blobToStrapiCover, type StrapiLikeCover } from '../../shared/media-accessibility'
import type { MediaFileMetadata } from '../../shared/media-file-metadata'
import { resolveGlossaryAffiliateUrl } from '../../shared/glossary-affiliate'
import { resolveGlossaryIconify } from '../../shared/glossary-icons'
import { glossaryPublicPathIfPublished } from '../../shared/public-site-paths'

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

type GlossaryFamilyTermLike = {
  id: number
  name: string
  slug: string
  status?: string
}

type GlossaryTermLike = {
  id: number
  name: string
  slug: string
  kind?: string
  status?: string
  parentId?: number | null
  parent?: GlossaryFamilyTermLike | null
  iconKey?: string | null
  partnerUrl?: string | null
  amazonAsin?: string | null
  cover?: unknown
  coverBlobPathname?: string | null
}

type IngredientRowLike = {
  glossaryTermId?: number
  name?: string
  qty?: number | null
  unit?: string | null
  note?: string | null
  sortOrder?: number | null
  term?: GlossaryTermLike | null
}

type UtensilRowLike = {
  glossaryTermId?: number
  name?: string
  note?: string | null
  sortOrder?: number | null
  affiliateUrl?: string | null
  term?: GlossaryTermLike | null
}

type RecipeWithRelations = RecipeLike & {
  ingredients?: IngredientRowLike[] | null
  utensils?: UtensilRowLike[] | null
}

function flattenIngredient(row: IngredientRowLike) {
  const term = row.term
  return {
    glossaryTermId: row.glossaryTermId ?? term?.id,
    name: term?.name ?? row.name ?? '',
    slug: term?.slug,
    path: glossaryPublicPathIfPublished(term),
    qty: row.qty ?? null,
    unit: row.unit ?? 'none',
    note: row.note ?? null,
    sortOrder: row.sortOrder ?? 0,
  }
}

export function serializeGlossaryFamilyRef(term: GlossaryFamilyTermLike | null | undefined) {
  if (!term) return null
  return {
    id: term.id,
    name: term.name,
    slug: term.slug,
    path: glossaryPublicPathIfPublished(term),
  }
}

function glossaryTermIcon(kind: string | undefined, iconKey: string | null | undefined) {
  if (kind !== 'ustensile') return null
  return resolveGlossaryIconify(iconKey)
}

function flattenUtensil(row: UtensilRowLike, amazonTag: string | null) {
  const term = row.term
  const resolvedAffiliateUrl = term
    ? resolveGlossaryAffiliateUrl({
        partnerUrl: term.partnerUrl,
        amazonAsin: term.amazonAsin,
        amazonTag,
      })
    : null
  return {
    glossaryTermId: row.glossaryTermId ?? term?.id,
    name: term?.name ?? row.name ?? '',
    slug: term?.slug,
    path: glossaryPublicPathIfPublished(term),
    iconKey: term?.iconKey ?? null,
    icon: resolveGlossaryIconify(term?.iconKey),
    note: row.note ?? null,
    sortOrder: row.sortOrder ?? 0,
    resolvedAffiliateUrl,
  }
}

export function serializeGlossaryForScope<T extends GlossaryTermLike & {
  name: string
  coverAltText?: string | null
  coverDescription?: string | null
  coverBlobPathname?: string | null
  cover?: CoverBlob | null
}>(
  term: T,
  scope: 'public' | 'admin',
): T {
  if (scope === 'admin') {
    return {
      ...term,
      title: term.name,
      icon: glossaryTermIcon(term.kind, term.iconKey),
      parent: serializeGlossaryFamilyRef(term.parent),
    } as T
  }
  const {
    coverAltText,
    coverDescription,
    cover,
    coverBlobPathname,
    amazonAsin: _amazonAsin,
    partnerUrl: _partnerUrl,
    parent,
    ...rest
  } = term
  const resolvedCover =
    cover ?? (coverBlobPathname ? coverBlobFromPathname(coverBlobPathname) : null)
  return {
    ...rest,
    title: term.name,
    icon: glossaryTermIcon(term.kind, term.iconKey),
    parent: serializeGlossaryFamilyRef(parent),
    cover: resolvedCover
      ? blobToStrapiCover(resolvedCover, {
          altOverride: coverAltText,
          descriptionOverride: coverDescription,
          titleFallback: term.name,
        })
      : null,
  } as T
}

export function serializeRecipeForScope<T extends RecipeWithRelations>(
  recipe: T,
  scope: 'public' | 'admin',
  amazonTag: string | null = null,
): T {
  const withRelations = {
    ...recipe,
    ingredients: recipe.ingredients?.map(flattenIngredient),
    utensils: recipe.utensils?.map(row => flattenUtensil(row, amazonTag)),
  }
  if (scope === 'admin') {
    return withRelations as T
  }
  return serializeCover(withRelations) as T
}
