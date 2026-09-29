<script setup lang="ts">
import type { PageBlock } from '~/composables/usePageDocument'
import { buildContentBlockSimples } from '@journalducuistot/shared/markdown'
import { PreviewMarkdown } from '~/utils/markdown/preview-markdown'

const PERSIST_DEBOUNCE_MS = 300
const simpleViews = buildContentBlockSimples()

const props = defineProps<{
  block: PageBlock
  selected?: boolean
}>()

const emit = defineEmits<{
  updateProse: [id: string, markdown: string]
  updateSlots: [slots: Record<string, string>]
  updateProps: [props: Record<string, string>]
}>()

const simpleView = computed(() => {
  if (props.block.kind !== 'section') return null
  return simpleViews[props.block.tag] ?? null
})

const slotMarkdown = computed(() => {
  if (props.block.kind !== 'section') return ''
  return props.block.slots.default ?? ''
})

const extraSlots = computed(() => {
  if (props.block.kind !== 'section') return []
  return Object.entries(props.block.slots)
    .filter(([name, markdown]) => name !== 'default' && markdown.trim())
    .map(([name, markdown]) => ({ name, markdown }))
})

function onSlotValues(next: Record<string, string>) {
  emit('updateSlots', next)
}

const proseDraft = shallowRef(props.block.kind === 'prose' ? props.block.markdown : '')
let persistTimer: ReturnType<typeof setTimeout> | undefined
let lastProseId = props.block.kind === 'prose' ? props.block.id : null

function flushProse(id: string | null = lastProseId) {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = undefined
  }
  if (!id) return
  emit('updateProse', id, proseDraft.value)
}

function schedulePersist() {
  if (props.block.kind !== 'prose') return
  lastProseId = props.block.id
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => flushProse(props.block.id), PERSIST_DEBOUNCE_MS)
}

watch(
  () => props.block.kind === 'prose' ? props.block.id : '',
  (id, prevId) => {
    if (prevId) flushProse(prevId)
    lastProseId = id || null
    proseDraft.value = props.block.kind === 'prose' ? props.block.markdown : ''
  },
)

onBeforeUnmount(() => {
  flushProse()
})
</script>

<template>
  <div
    class="rounded-lg"
    :class="selected ? 'ring-2 ring-primary' : ''"
  >
    <component
      :is="simpleView"
      v-if="block.kind === 'section' && simpleView"
      v-bind="block.props"
      :expanded="selected"
      :values="block.props"
      :slot-values="block.slots"
      @update:slot-values="onSlotValues"
      @update:values="emit('updateProps', $event)"
    >
      <PreviewMarkdown
        v-if="slotMarkdown.trim()"
        :value="slotMarkdown"
      />
      <template
        v-for="slot in extraSlots"
        :key="slot.name"
        #[slot.name]
      >
        <PreviewMarkdown :value="slot.markdown" />
      </template>
    </component>
    <p
      v-else-if="block.kind === 'section'"
      class="px-3 py-2 font-mono text-xs text-muted"
    >
      ::{{ block.tag }}
    </p>
    <div
      v-else
      class="space-y-2 rounded-lg border border-default/70 p-3"
    >
      <p class="text-sm font-medium text-highlighted">
        Texte
      </p>
      <PreviewMarkdown
        v-if="proseDraft.trim()"
        :value="proseDraft"
      />
      <UTextarea
        v-model="proseDraft"
        autoresize
        :rows="3"
        placeholder="Markdown"
        @click.stop
        @update:model-value="schedulePersist"
        @blur="flushProse(block.id)"
      />
    </div>
  </div>
</template>
