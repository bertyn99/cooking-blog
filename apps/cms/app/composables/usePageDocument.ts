import type { Ref } from 'vue'
import { parsePageContent } from '#shared/content-blocks/parse'
import { serializePageDocument } from '#shared/content-blocks/serialize'
import type { PageBlock, PageDocument, SectionBlock } from '#shared/content-blocks/document'
import { nextUnusedBlockId } from '#shared/content-blocks/document'
import { defaultSectionMarkdown } from '#shared/content-blocks/insert'
import { isSectionBlockTag, PAGE_BLOCK_CATALOG, type SectionBlockTag } from '#shared/content-blocks/catalog'

const PARSE_DEBOUNCE_MS = 200

export function usePageDocument(content: Ref<string>, options: { active: Ref<boolean> }) {
  const document = shallowRef<PageDocument>({ blocks: [] })
  const parsing = ref(false)
  let generation = 0
  let lastPersisted = content.value
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  onBeforeUnmount(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  function discardInFlightParse() {
    generation += 1
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = undefined
    }
    parsing.value = false
  }

  async function reloadFromMarkdown() {
    const gen = ++generation
    parsing.value = true
    try {
      const next = await parsePageContent(content.value)
      if (gen !== generation) return
      document.value = next
      lastPersisted = content.value
    }
    finally {
      if (gen === generation) parsing.value = false
    }
  }

  function scheduleReload() {
    if (!options.active.value) return
    if (content.value === lastPersisted) return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      void reloadFromMarkdown()
    }, PARSE_DEBOUNCE_MS)
  }

  watch(content, scheduleReload)

  watch(
    () => options.active.value,
    (active) => {
      if (active) void reloadFromMarkdown()
    },
    { immediate: true },
  )

  async function persistToMarkdown() {
    discardInFlightParse()
    const serialized = await serializePageDocument(document.value)
    lastPersisted = serialized
    content.value = serialized
  }

  async function insertSection(tag: SectionBlockTag) {
    discardInFlightParse()
    const snippet = defaultSectionMarkdown(tag)
    const parsed = await parsePageContent(snippet)
    const block = parsed.blocks.find(item => item.kind === 'section')
    if (!block || block.kind !== 'section') return
    block.id = nextUnusedBlockId(document.value.blocks, 'section', tag)
    document.value = {
      blocks: [...document.value.blocks, block],
    }
    await persistToMarkdown()
  }

  async function removeBlock(id: string) {
    discardInFlightParse()
    document.value = {
      blocks: document.value.blocks.filter(block => block.id !== id),
    }
    await persistToMarkdown()
  }

  async function moveBlock(id: string, direction: -1 | 1) {
    const blocks = [...document.value.blocks]
    const index = blocks.findIndex(block => block.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= blocks.length) return
    const [item] = blocks.splice(index, 1)
    blocks.splice(target, 0, item!)
    discardInFlightParse()
    document.value = { blocks }
    await persistToMarkdown()
  }

  async function updateSectionProps(block: SectionBlock, props: Record<string, string>) {
    discardInFlightParse()
    document.value = {
      blocks: document.value.blocks.map((item) => {
        if (item.id !== block.id || item.kind !== 'section') return item
        return { ...item, props: { ...item.props, ...props } }
      }),
    }
    await persistToMarkdown()
  }

  async function updateProseMarkdown(id: string, markdown: string) {
    discardInFlightParse()
    document.value = {
      blocks: document.value.blocks.map((item) => {
        if (item.id !== id || item.kind !== 'prose') return item
        return { ...item, markdown }
      }),
    }
    await persistToMarkdown()
  }

  const palette = PAGE_BLOCK_CATALOG.filter(item => item.insertable)

  return {
    document,
    parsing,
    palette,
    reloadFromMarkdown,
    persistToMarkdown,
    insertSection,
    removeBlock,
    moveBlock,
    updateSectionProps,
    updateProseMarkdown,
  }
}

export { isSectionBlockTag }
export type { PageBlock, PageDocument, SectionBlock, SectionBlockTag }
