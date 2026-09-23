<script setup lang="ts">
import { catalogEntryForTag } from '#shared/content-blocks/catalog'
import type { SectionBlock } from '~/composables/usePageDocument'

const PERSIST_DEBOUNCE_MS = 300

const props = defineProps<{
  block: SectionBlock
}>()

const emit = defineEmits<{
  updateProps: [props: Record<string, string>]
}>()

const def = computed(() => catalogEntryForTag(props.block.tag))

const draft = reactive<Record<string, string>>({})
let persistTimer: ReturnType<typeof setTimeout> | undefined

function syncDraft() {
  for (const key of def.value.allowedProps) {
    draft[key] = String(props.block.props[key] ?? def.value.defaultProps[key] ?? '')
  }
}

function snapshot(): Record<string, string> {
  const next: Record<string, string> = {}
  for (const key of def.value.allowedProps) {
    next[key] = draft[key] ?? ''
  }
  return next
}

function isUnchanged(next: Record<string, string>): boolean {
  return def.value.allowedProps.every((key) => {
    const current = String(props.block.props[key] ?? def.value.defaultProps[key] ?? '')
    return (next[key] ?? '') === current
  })
}

function persist() {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = undefined
  }
  const next = snapshot()
  if (isUnchanged(next)) return
  emit('updateProps', next)
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(persist, PERSIST_DEBOUNCE_MS)
}

watch(
  () => props.block.id,
  (_id, prevId) => {
    if (prevId) persist()
    syncDraft()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  persist()
})

const sourceItems = [
  { label: 'Derniers', value: 'latest' },
  { label: 'Catégorie', value: 'category' },
  { label: 'Slugs', value: 'slugs' },
]
</script>

<template>
  <UCard v-if="def.allowedProps.length" :ui="{ body: 'p-4 space-y-3' }">
    <p class="text-sm font-medium">
      {{ def.label }}
    </p>
    <p class="text-xs text-muted">
      {{ def.description }}
    </p>

    <UFormField
      v-for="key in def.allowedProps"
      :key="key"
      :label="key"
    >
      <USelect
        v-if="key === 'source'"
        v-model="draft[key]"
        :items="sourceItems"
        @update:model-value="persist"
      />
      <UInput
        v-else
        v-model="draft[key]"
        :placeholder="String(def.defaultProps[key] ?? '')"
        @update:model-value="schedulePersist"
        @blur="persist"
      />
    </UFormField>
  </UCard>
</template>
