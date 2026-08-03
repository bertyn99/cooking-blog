export const MEDIA_UPLOAD_ROOT = 'uploads/'

export const MEDIA_FOLDER_MARKER = '.folder'

export const MEDIA_FOLDER_MARKER_MIME = 'application/x-media-folder'

export function normalizeMediaFolderPrefix(input?: string | null): string {
  if (!input || input === MEDIA_UPLOAD_ROOT) {
    return MEDIA_UPLOAD_ROOT
  }
  let value = input.trim().replace(/^\/+/, '')
  if (!value.startsWith('uploads/')) {
    value = `uploads/${value}`
  }
  if (!value.endsWith('/')) {
    value += '/'
  }
  return value
}

export function isMediaFolderMarkerPathname(pathname: string): boolean {
  return pathname.endsWith(`/${MEDIA_FOLDER_MARKER}`)
}

export function folderSlugFromMarkerPathname(pathname: string): string | null {
  if (!isMediaFolderMarkerPathname(pathname)) {
    return null
  }
  const withoutRoot = pathname.slice(MEDIA_UPLOAD_ROOT.length)
  return withoutRoot.slice(0, -(MEDIA_FOLDER_MARKER.length + 1)) || null
}

export function folderPrefixFromSlug(slug: string): string {
  const safe = slugifyFolderSegment(slug)
  return `${MEDIA_UPLOAD_ROOT}${safe}/`
}

export function slugifyFolderSegment(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export function parentFolderPrefix(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length <= 2) {
    return MEDIA_UPLOAD_ROOT
  }
  return `${parts.slice(0, -1).join('/')}/`
}

export function filenameInPathname(pathname: string): string {
  return pathname.split('/').pop() ?? pathname
}

export type MediaKind = 'image' | 'folder' | 'other'

export function mediaKindFromMime(mime?: string | null): MediaKind {
  if (mime === MEDIA_FOLDER_MARKER_MIME) {
    return 'folder'
  }
  if (mime?.startsWith('image/')) {
    return 'image'
  }
  return 'other'
}

export function mediaKindLabel(kind: MediaKind): string {
  switch (kind) {
    case 'image':
      return 'Image'
    case 'folder':
      return 'Dossier'
    default:
      return 'Fichier'
  }
}
