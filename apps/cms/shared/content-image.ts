/** Aspect ratios for inline article/recipe images (markdown title encodes the value). */
export const CONTENT_IMAGE_ASPECTS = [
  { value: '16:9', label: '16:9', className: 'aspect-[16/9]' },
  { value: '4:3', label: '4:3', className: 'aspect-[4/3]' },
  { value: '3:2', label: '3:2', className: 'aspect-[3/2]' },
  { value: '1:1', label: '1:1', className: 'aspect-square' },
  { value: '3:4', label: '3:4', className: 'aspect-[3/4]' },
] as const

export type ContentImageAspect = (typeof CONTENT_IMAGE_ASPECTS)[number]['value']

export const DEFAULT_CONTENT_IMAGE_ASPECT: ContentImageAspect = '4:3'

const ASPECT_RE = /^(\d+):(\d+)$/

export function isContentImageAspect(value: string | null | undefined): value is ContentImageAspect {
  if (!value) return false
  return CONTENT_IMAGE_ASPECTS.some(item => item.value === value)
}

/** TipTap Image `title` stores the aspect ratio for markdown round-trip. */
export function parseImageAspectFromTitle(title: string | null | undefined): ContentImageAspect | null {
  const trimmed = title?.trim()
  if (!trimmed || !ASPECT_RE.test(trimmed)) return null
  return isContentImageAspect(trimmed) ? trimmed : null
}

export function contentImageAspectClass(
  aspect: string | null | undefined,
  fallback: ContentImageAspect = DEFAULT_CONTENT_IMAGE_ASPECT,
): string {
  const key = parseImageAspectFromTitle(aspect) ?? fallback
  return CONTENT_IMAGE_ASPECTS.find(item => item.value === key)?.className
    ?? 'aspect-[4/3]'
}

/** Base + aspect Tailwind classes for TipTap / prose `<img>` nodes. */
export function contentImageClassList(
  title: string | null | undefined,
  extras?: string | null,
): string {
  return [
    'cms-editor-image',
    'max-w-full',
    'w-4/5',
    'rounded-md',
    'object-cover',
    contentImageAspectClass(title),
    extras,
  ].filter(Boolean).join(' ')
}

/** Map CMS public `/images/…` URL (optional IPX ops) → `uploads/…` pathname. */
export function pathnameFromContentImageSrc(src: string): string | null {
  const raw = src.trim()
  if (!raw) return null
  let path = raw
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      path = new URL(raw).pathname
    }
    catch {
      return null
    }
  }
  path = path.replace(/^\/+/, '')
  if (path.startsWith('images/')) {
    path = path.slice('images/'.length)
  }
  // Strip IPX modifiers segment when present (`w_400,f_webp/uploads/…`).
  if (!path.startsWith('uploads/')) {
    const slash = path.indexOf('/')
    if (slash > 0) {
      path = path.slice(slash + 1)
    }
  }
  return path.startsWith('uploads/') ? path : null
}

const MD_IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g

export interface MarkdownImageMatch {
  full: string
  alt: string
  src: string
  title: string | null
  index: number
}

export function iterateMarkdownImages(text: string): MarkdownImageMatch[] {
  const out: MarkdownImageMatch[] = []
  for (const match of text.matchAll(MD_IMAGE_RE)) {
    out.push({
      full: match[0]!,
      alt: match[1] ?? '',
      src: match[2] ?? '',
      title: match[3] ?? null,
      index: match.index ?? 0,
    })
  }
  return out
}

export function serializeMarkdownImage(opts: {
  alt: string
  src: string
  title?: string | null
}): string {
  const alt = opts.alt.replace(/[[\]]/g, '')
  const title = opts.title?.trim()
  return title ? `![${alt}](${opts.src} "${title}")` : `![${alt}](${opts.src})`
}

/** True when alt is missing or a generic placeholder from import. */
export function isEmptyOrGenericImageAlt(alt: string | null | undefined): boolean {
  const trimmed = alt?.trim() ?? ''
  if (!trimmed) return true
  return trimmed === 'image' || trimmed === 'Image'
}
