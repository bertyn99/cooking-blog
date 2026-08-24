export interface PexelsPhotoSrc {
  original: string
  large2x: string
  large: string
  medium: string
  small: string
  portrait: string
  landscape: string
  tiny: string
}

export interface PexelsPhoto {
  id: number
  width: number
  height: number
  url: string
  photographer: string
  photographer_url: string
  photographer_id: number
  avg_color: string
  alt: string
  src: PexelsPhotoSrc
}

export interface PexelsSearchResponse {
  page: number
  per_page: number
  total_results: number
  next_page?: string
  photos: PexelsPhoto[]
}

export interface StockSearchItem {
  id: string
  provider: 'pexels'
  width: number
  height: number
  alt: string
  photographer: string
  photographerUrl: string
  pageUrl: string
  previewUrl: string
  src: PexelsPhotoSrc
}

export interface StockSearchResult {
  items: StockSearchItem[]
  page: number
  perPage: number
  total: number
  hasMore: boolean
}

export type StockOrientation = 'landscape' | 'portrait' | 'square'

function mapPexelsPhoto(photo: PexelsPhoto): StockSearchItem {
  return {
    id: String(photo.id),
    provider: 'pexels',
    width: photo.width,
    height: photo.height,
    alt: photo.alt || `Photo de ${photo.photographer}`,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    pageUrl: photo.url,
    previewUrl: photo.src.medium,
    src: photo.src,
  }
}

export function getPexelsApiKey(): string | undefined {
  const key = process.env.PEXELS_API_KEY?.trim()
  return key || undefined
}

export function assertPexelsConfigured(): string {
  const key = getPexelsApiKey()
  if (!key) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Stock indisponible (clé Pexels non configurée).',
    })
  }
  return key
}

export async function searchPexels(opts: {
  query: string
  page?: number
  perPage?: number
  orientation?: StockOrientation
  locale?: string
}): Promise<StockSearchResult> {
  const apiKey = assertPexelsConfigured()
  const page = Math.max(1, opts.page ?? 1)
  const perPage = Math.min(Math.max(opts.perPage ?? 20, 1), 40)
  const params = new URLSearchParams({
    query: opts.query.trim(),
    page: String(page),
    per_page: String(perPage),
    locale: opts.locale ?? 'fr-FR',
  })
  if (opts.orientation) {
    params.set('orientation', opts.orientation)
  }

  const response = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: apiKey },
  })

  if (response.status === 429) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Limite Pexels atteinte. Réessayez plus tard.',
    })
  }

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Erreur lors de la recherche Pexels.',
    })
  }

  const data = await response.json() as PexelsSearchResponse
  const items = data.photos.map(mapPexelsPhoto)
  const total = data.total_results
  const hasMore = page * perPage < total

  return {
    items,
    page,
    perPage,
    total,
    hasMore,
  }
}

export async function getPexelsPhotoById(id: string): Promise<StockSearchItem> {
  const apiKey = assertPexelsConfigured()
  const normalizedId = id.trim()
  if (!/^\d+$/.test(normalizedId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifiant Pexels invalide.',
    })
  }

  const response = await fetch(`https://api.pexels.com/v1/photos/${normalizedId}`, {
    headers: { Authorization: apiKey },
  })

  if (response.status === 404) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Photo Pexels introuvable.',
    })
  }

  if (response.status === 429) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Limite Pexels atteinte. Réessayez plus tard.',
    })
  }

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Erreur lors de la récupération de la photo Pexels.',
    })
  }

  const data = await response.json() as { photo: PexelsPhoto }
  return mapPexelsPhoto(data.photo)
}

const PEXELS_IMAGE_HOST_PATTERN = /(^|\.)pexels\.com$/i

function assertPexelsImageUrl(url: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  }
  catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'URL d’image Pexels invalide.',
    })
  }

  if (parsed.protocol !== 'https:') {
    throw createError({
      statusCode: 502,
      statusMessage: 'URL d’image Pexels invalide.',
    })
  }

  if (!PEXELS_IMAGE_HOST_PATTERN.test(parsed.hostname)) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Hôte d’image non autorisé.',
    })
  }

  return parsed.toString()
}

export async function downloadPexelsPhoto(
  photo: Pick<StockSearchItem, 'src'>,
  preferredSize: 'original' | 'large' = 'large',
): Promise<{ buffer: ArrayBuffer, contentType: string }> {
  const rawUrl = preferredSize === 'original' ? photo.src.original : photo.src.large
  const url = assertPexelsImageUrl(rawUrl)
  const response = await fetch(url)
  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Échec du téléchargement de l’image Pexels.',
    })
  }
  const contentType = response.headers.get('content-type') ?? 'image/jpeg'
  const buffer = await response.arrayBuffer()
  return { buffer, contentType }
}
