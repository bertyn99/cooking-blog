<script setup lang="ts">
import type { PageBlock } from '~/composables/usePageDocument'
import { PAGE_BLOCK_CATALOG } from '#shared/content-blocks/catalog'

const PERSIST_DEBOUNCE_MS = 300

const props = defineProps<{
  block: PageBlock
  selected?: boolean
}>()

const emit = defineEmits<{
  updateProse: [id: string, markdown: string]
}>()

const def = computed(() => {
  if (props.block.kind !== 'section') return null
  return PAGE_BLOCK_CATALOG.find(item => item.tag === props.block.tag)
})

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
  <UCard
    :ui="{ body: 'p-3' }"
    :class="selected ? 'ring-2 ring-primary' : ''"
  >
    <div class="flex items-start gap-2">
      <UIcon
        v-if="def"
        :name="def.icon"
        class="mt-0.5 size-5 text-muted"
      />
      <div class="min-w-0 flex-1">
        <p class="font-medium">
          {{ def?.label ?? (block.kind === 'prose' ? 'Texte' : block.kind) }}
        </p>
        <p v-if="block.kind === 'section'" class="text-xs text-muted font-mono">
          ::{{ block.tag }}
        </p>
        <UTextarea
          v-else
          v-model="proseDraft"
          autoresize
          :rows="3"
          class="mt-2"
          @click.stop
          @update:model-value="schedulePersist"
          @blur="flushProse(block.id)"
        />
      </div>
    </div>
  </UCard>
</template>
