import { useRuntimeConfig } from 'nuxt/server'

/**
 * Pinterest API v5 client + config + pin copy helpers.
 *
 * Rules encoded here come from the pinterest-growth / pinterest-seo playbooks
 * (.agents/skills/pinterest-growth, .agents/skills/pinterest-seo):
 * - pins link to the content page (never the homepage),
 * - images served 2:3 (1000×1500) — other ratios are penalized,
 * - title `[Mot-clé] | [Bénéfice] | [Contexte]` ≤ 100 chars, keyword first,
 * - description 100–200 chars, natural French, no hashtags, no stuffing,
 * - fresh pins, ≥72h between pins to the same URL, 3–10 pins/day.
 */

export interface PinterestConfig {
  accessToken: string
  defaultBoardId: string
  /** JSON map `{ "cuisine-sante": "<boardId>", "*": "<boardId>" }` — Pin→Board→Page alignment. */
  boardsJson: string
}

export function getPinterestConfig(): PinterestConfig {
  const config = useRuntimeConfig() as unknown as {
    pinterestAccessToken?: string
    pinterestDefaultBoardId?: string
    pinterestBoards?: string
  }
  return {
    accessToken: config.pinterestAccessToken ?? '',
    defaultBoardId: config.pinterestDefaultBoardId ?? '',
    boardsJson: config.pinterestBoards ?? '',
  }
}

export function isPinterestConfigured(config = getPinterestConfig()): boolean {
  return Boolean(config.accessToken && (config.defaultBoardId || config.boardsJson))
}

/**
 * Resolve the board for a content category — Pin → Board → Page must share the
 * same keyword phrase, so boards are selected per CMS category when mapped.
 */
export function resolveBoardId(config: PinterestConfig, categorySlug?: string | null): string {
  if (categorySlug && config.boardsJson) {
    try {
      const map = JSON.parse(config.boardsJson) as Record<string, string>
      const byCategory = map[categorySlug]
      if (byCategory) {
        return byCategory
      }
    }
    catch {
      // Malformed PINTEREST_BOARDS — fall through to the default board.
    }
  }
  return config.defaultBoardId
}

/** 2:3 vertical pin URL (1000×1500, fit cover) through the public site image pipeline. */
export function buildPinImageUrl(siteUrl: string, imagePath: string): string {
  const origin = siteUrl.replace(/\/$/, '')
  const path = imagePath.replace(/^\//, '')
  return `${origin}/images/w_1000,h_1500/${path}`
}

export interface CreatePinInput {
  boardId: string
  title: string
  description: string
  imageUrl: string
  link: string
}

export interface CreatePinResult {
  ok: boolean
  pinId?: string
  error?: string
}

/** POST /v5/pins — returns the created pin id. Never throws. */
export async function createPinterestPin(
  accessToken: string,
  input: CreatePinInput,
): Promise<CreatePinResult> {
  try {
    const response = await fetch('https://api.pinterest.com/v5/pins', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        board_id: input.boardId,
        title: input.title.slice(0, 100),
        description: input.description.slice(0, 500),
        link: input.link.slice(0, 2048),
        media_source: {
          source_type: 'image_url',
          url: input.imageUrl,
        },
      }),
      signal: AbortSignal.timeout(20_000),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      return { ok: false, error: `pinterest_${response.status}: ${body.slice(0, 300)}` }
    }

    const created = await response.json() as { id?: string }
    if (!created.id) {
      return { ok: false, error: 'pinterest_response_missing_id' }
    }
    return { ok: true, pinId: created.id }
  }
  catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/** Extract body-image blob pathnames from content markdown (`![alt](/uploads/…)` shapes). */
export function extractContentImagePaths(markdown: string | null | undefined): string[] {
  if (!markdown) {
    return []
  }
  const paths: string[] = []
  const imageRe = /!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g
  let match: RegExpExecArray | null
  while ((match = imageRe.exec(markdown))) {
    const raw = match[1]
    // Ignore external/absolute-URL images — only CMS media can be pinned (same-origin asset).
    if (/^https?:\/\//i.test(raw)) {
      continue
    }
    // Normalize `/images/_/uploads/x.webp`, `/uploads/x.webp`, `uploads/x.webp` → `uploads/x.webp`.
    const normalized = raw.replace(/^\//, '').replace(/^(?:images\/(?:[a-z0-9_,-]+|_)\/)?(?=uploads\/)/, '')
    if (normalized.startsWith('uploads/')) {
      paths.push(normalized)
    }
  }
  return [...new Set(paths)]
}

/** Max pins per destination (pinterest-growth: 3–5 distinct fresh designs). */
export const MAX_PINS_PER_CONTENT = 5
/** Hours between two pins pointing at the same URL (pinterest-growth: ≥72h). */
export const SAME_URL_SPACING_HOURS = 72
/** Account cadence cap per drain (pinterest-growth: 3–10 pins/day). */
export const DAILY_PIN_CAP = 8

/** Spread `not_before` over 72h steps so same-URL pins never burst. */
export function buildNotBeforeSchedule(count: number, from = new Date()): string[] {
  return Array.from({ length: count }, (_, i) =>
    new Date(from.getTime() + i * SAME_URL_SPACING_HOURS * 3_600_000).toISOString())
}

export interface PinCopyInput {
  title: string
  excerpt: string
  isCover: boolean
}

export interface PinCopy {
  title: string
  description: string
}

/** Deterministic fallback copy (no AI binding, dev, or AI failure). */
export function fallbackPinCopy(input: PinCopyInput): PinCopy {
  const title = input.title.slice(0, 100)
  const description = `${input.title} — ${input.excerpt}`.replace(/\s+/g, ' ').trim().slice(0, 200)
  return { title, description }
}

/**
 * French Pinterest-copy prompt (pinterest-seo FOUND rules):
 * title `[Mot-clé] | [Bénéfice] | [Contexte]` ≤ 100 chars, keyword first;
 * description 100–200 chars, natural, no hashtags, no stuffing.
 */
export function buildPinCopyPrompt(input: PinCopyInput): string {
  const kind = input.isCover ? 'image de couverture' : 'image de l’article'
  return [
    'Tu écris le texte d’un pin Pinterest (moteur de recherche visuel) pour un blog de cuisine français.',
    `Rôle de l’image : ${kind} de la page.`,
    `Titre de la page : ${input.title}`,
    `Extrait : ${input.excerpt}`,
    '',
    'RÈGLES :',
    '- TITRE : format « Mot-clé principal | Bénéfice | Contexte », ≤ 100 caractères, le mot-clé en premier, en français.',
    '- DESCRIPTION : 100 à 200 caractères, français naturel et appétissant, reprend le mot-clé et un bénéfice concret, incite au clic.',
    '- Interdit : hashtags, emojis, keyword stuffing, superlatifs creux, promesses invérifiables.',
    '',
    'Réponds EXACTEMENT dans ce format :',
    'TITRE: <ton titre>',
    'DESCRIPTION: <ta description>',
  ].join('\n')
}

export function parsePinCopyResponse(output: string, input: PinCopyInput): PinCopy {
  const titleMatch = output.match(/^TITRE\s*:\s*(.+)$/im)
  const descriptionMatch = output.match(/^DESCRIPTION\s*:\s*(.+)$/im)
  if (!titleMatch || !descriptionMatch) {
    return fallbackPinCopy(input)
  }
  const title = titleMatch[1].trim().slice(0, 100)
  const description = descriptionMatch[1].trim().slice(0, 200)
  if (title.length < 10 || description.length < 40) {
    return fallbackPinCopy(input)
  }
  return { title, description }
}
