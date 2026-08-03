/**
 * Discover candidates inside a long ebook / paste source.
 * Heuristic first (heading splits); Workers AI can refine later.
 */

export interface DiscoverCandidate {
  id: string
  title: string
  targetType: 'article' | 'recipe'
  markdown: string
  charStart: number
  charEnd: number
  confidence: number
}

export interface DiscoverArtifact {
  candidates: DiscoverCandidate[]
  discoveredAt: string
  strategy: 'heading-split' | 'single-fallback'
  note?: string
}

const RECIPE_HINT
  = /\b(ingr[eé]dients?|pr[eé]paration|cuisson|recette|minutes?|personnes?|étapes?|etapes?)\b/i

function slugifyCandidateId(title: string, index: number) {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  return `${base || 'item'}-${index + 1}`
}

function classifyBlock(
  title: string,
  body: string,
  preferred: 'article' | 'recipe',
): 'article' | 'recipe' {
  const sample = `${title}\n${body.slice(0, 1200)}`
  if (RECIPE_HINT.test(sample)) {
    return 'recipe'
  }
  if (/\b(conseil|astuce|histoire|pourquoi|comment|guide|édito|editorial)\b/i.test(sample)) {
    return 'article'
  }
  return preferred
}

/**
 * Split markdown on top-level headings (# or ## when # is sparse).
 */
export function discoverCandidatesFromMarkdown(input: {
  markdown: string
  preferredTargetType: 'article' | 'recipe'
  titleHint?: string | null
}): DiscoverArtifact {
  const markdown = input.markdown.trim()
  const discoveredAt = new Date().toISOString()

  if (!markdown) {
    return {
      candidates: [],
      discoveredAt,
      strategy: 'single-fallback',
      note: 'Empty source',
    }
  }

  const h1Matches = [...markdown.matchAll(/^#\s+.+$/gm)]
  const headingLevel = h1Matches.length >= 2 ? 1 : 2
  const headingRe = headingLevel === 1 ? /^#\s+(.+)$/gm : /^##\s+(.+)$/gm
  const headings = [...markdown.matchAll(headingRe)]

  if (headings.length < 2) {
    const title = input.titleHint?.trim()
      || headings[0]?.[1]?.trim()
      || (input.preferredTargetType === 'recipe' ? 'Recette extraite' : 'Article extrait')
    return {
      candidates: [{
        id: slugifyCandidateId(title, 0),
        title,
        targetType: classifyBlock(title, markdown, input.preferredTargetType),
        markdown,
        charStart: 0,
        charEnd: markdown.length,
        confidence: 0.4,
      }],
      discoveredAt,
      strategy: 'single-fallback',
      note: 'Single block — no multi-heading split',
    }
  }

  const candidates: DiscoverCandidate[] = []
  for (let i = 0; i < headings.length; i += 1) {
    const match = headings[i]!
    const title = match[1]!.trim()
    const charStart = match.index ?? 0
    const next = headings[i + 1]
    const charEnd = next?.index ?? markdown.length
    const block = markdown.slice(charStart, charEnd).trim()
    if (block.length < 80) {
      continue
    }
    candidates.push({
      id: slugifyCandidateId(title, candidates.length),
      title,
      targetType: classifyBlock(title, block, input.preferredTargetType),
      markdown: block,
      charStart,
      charEnd,
      confidence: 0.7,
    })
  }

  if (candidates.length === 0) {
    const title = input.titleHint?.trim() || 'Contenu ebook'
    return {
      candidates: [{
        id: slugifyCandidateId(title, 0),
        title,
        targetType: input.preferredTargetType,
        markdown,
        charStart: 0,
        charEnd: markdown.length,
        confidence: 0.3,
      }],
      discoveredAt,
      strategy: 'single-fallback',
    }
  }

  return {
    candidates,
    discoveredAt,
    strategy: 'heading-split',
  }
}
