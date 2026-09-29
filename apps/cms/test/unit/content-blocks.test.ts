import { describe, expect, it } from 'vitest'
import {
  assertPageDocument,
  catalogEntryForTag,
  fieldKindMeta,
  nextUnusedBlockId,
  parsePageContent,
  pageContentRoundTrip,
  propCountLabel,
  PUBLIC_SITE_IMAGES,
  serializePageDocument,
  uniqueFieldKinds,
  visibleFields,
} from '@journalducuistot/shared/content-blocks'

describe('parsePageContent', () => {
  it('parses section blocks and prose regions', async () => {
    const md = `::hero{image="/img/hero.jpg"}
::

## Bonjour

Texte **gras**.

::recipe-list{source="latest" limit="4"}
::`

    const doc = await parsePageContent(md)
    expect(doc.blocks).toHaveLength(3)
    expect(doc.blocks[0]).toMatchObject({ kind: 'section', tag: 'hero' })
    expect(doc.blocks[1]?.kind).toBe('prose')
    expect(doc.blocks[2]).toMatchObject({ kind: 'section', tag: 'recipe-list' })
    assertPageDocument(doc)
  })

  it('lifts grid, callout and markdown images out of prose', async () => {
    const md = `::hero{image="/img/hero.jpg"}
::

[**lien**](/blog/x)

::grid{cols="2"}
Gauche
::

![Un plat](/img/hero.jpg "4:3")

::callout{type="tip"}
Astuce
::
`

    const doc = await parsePageContent(md)
    const tags = doc.blocks.map(block => block.kind === 'section' ? block.tag : block.kind)
    expect(tags).toEqual(['hero', 'prose', 'grid', 'image', 'callout'])
    const image = doc.blocks.find(block => block.kind === 'section' && block.tag === 'image')
    expect(image).toMatchObject({
      kind: 'section',
      tag: 'image',
      props: { src: '/img/hero.jpg', alt: 'Un plat', title: '4:3' },
    })
    const round = await serializePageDocument(doc)
    expect(round).toContain('![Un plat](/img/hero.jpg "4:3")')
    expect(round).toContain('::grid{cols="2"}')
    expect(round).toContain('::callout{type="tip"}')
  })

  it('round-trips homepage seed markdown', async () => {
    const md = `::hero{image="/img/hero.jpg"}
::

::newsletter
::

::recipe-list{source="latest" limit="4"}
::

::article-list{source="latest" limit="5"}
::`

    const round = await pageContentRoundTrip(md)
    expect(round).toContain('::hero{image="/img/hero.jpg"}')
    expect(round).toContain('::recipe-list{source="latest" limit="4"}')
    expect(round).toContain('::article-list{source="latest" limit="5"}')
  })

  it('drops unknown section props on parse/serialize', async () => {
    const md = `::hero{image="/img/hero.jpg" onclick="alert(1)"}
::`
    const doc = await parsePageContent(md)
    expect(doc.blocks[0]).toMatchObject({ kind: 'section', tag: 'hero' })
    if (doc.blocks[0]?.kind !== 'section') throw new Error('expected section')
    expect(doc.blocks[0].props).toEqual({ image: '/img/hero.jpg', alt: '' })
    const out = await serializePageDocument(doc)
    expect(out).not.toContain('onclick')
  })

  it('serializes prose between sections', async () => {
    const md = '## T\n\nPara.'
    const doc = await parsePageContent(md)
    const out = await serializePageDocument(doc)
    expect(out).toContain('## T')
    expect(out).toContain('Para.')
  })

  it('assigns unique ids after a hole in the list', () => {
    const afterDelete = nextUnusedBlockId(
      [
        { id: 'section-0-hero' },
        { id: 'section-2-hero' },
      ],
      'section',
      'hero',
    )
    expect(afterDelete).toBe('section-3-hero')
    const collision = nextUnusedBlockId(
      [{ id: 'section-2-hero' }, { id: 'section-3-hero' }],
      'section',
      'hero',
    )
    expect(collision).toBe('section-4-hero')
  })

  it('parses named Comark slots into the section tree', async () => {
    const md = `::hero{image="/img/hero.jpg"}
#default
Accroche
::

::callout{type="tip"}
#default
Astuce
::`

    const doc = await parsePageContent(md)
    expect(doc.blocks[0]).toMatchObject({
      kind: 'section',
      tag: 'hero',
      slots: { default: 'Accroche' },
    })
    expect(doc.blocks[1]).toMatchObject({
      kind: 'section',
      tag: 'callout',
      props: { type: 'tip' },
      slots: { default: 'Astuce' },
    })
    const round = await serializePageDocument(doc)
    expect(round).toContain('Accroche')
    expect(round).toContain('::callout{type="tip"}')
  })

  it('escapes quotes, braces and newlines in section attrs', async () => {
    const doc = await parsePageContent('::hero{image="/img/hero.jpg"}\n::')
    const block = doc.blocks[0]
    if (block?.kind !== 'section') throw new Error('expected section')
    block.props.image = 'say "hi"}\n/img/x.jpg'
    const out = await serializePageDocument(doc)
    expect(out).toContain('image="say \\"hi\\"\\}\\n/img/x.jpg"')
    expect(out).not.toMatch(/image="[^"]*\n/)
  })
})

describe('content block field schema', () => {
  it('counts visible props and unique input kinds', () => {
    const recipe = catalogEntryForTag('recipe-list')
    const latest = visibleFields(recipe.fields, { source: 'latest', limit: '4' })
    expect(latest.map(field => field.key)).toEqual(['source', 'limit'])
    expect(propCountLabel(latest.length)).toBe('2 props')
    expect(uniqueFieldKinds(latest).map(kind => kind.label)).toEqual(['Liste', 'Nombre'])

    const byCategory = visibleFields(recipe.fields, { source: 'category' })
    expect(byCategory.map(field => field.key)).toContain('category')
    expect(byCategory.map(field => field.key)).not.toContain('slugs')
  })

  it('labels media and text kinds for Studio badges', () => {
    const hero = catalogEntryForTag('hero')
    expect(uniqueFieldKinds(hero.fields)).toEqual([
      { kind: 'media', label: 'Média', icon: 'i-lucide-image' },
      { kind: 'text', label: 'Texte', icon: 'i-lucide-type' },
    ])
    expect(propCountLabel(hero.fields.length)).toBe('2 props')
    expect(fieldKindMeta('color')).toMatchObject({ label: 'Couleur', icon: 'i-lucide-palette' })
    expect(fieldKindMeta('text').label).toBe('Texte')
  })

  it('lists public site images for the Studio site tab', () => {
    expect(PUBLIC_SITE_IMAGES.some(item => item.src === '/img/hero.jpg')).toBe(true)
    expect(PUBLIC_SITE_IMAGES[0]?.alt.length).toBeGreaterThan(0)
  })

  it('applies catalog defaults when hero has no image attr', async () => {
    const doc = await parsePageContent('::hero\n::')
    expect(doc.blocks[0]).toMatchObject({
      kind: 'section',
      tag: 'hero',
      props: { image: '/img/hero.jpg', alt: '' },
    })
  })
})
