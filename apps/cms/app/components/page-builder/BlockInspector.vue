<script setup lang="ts">
import {
  catalogEntryForTag,
  editorComponentName,
  isSectionBlockTag,
} from '#shared/content-blocks'
import type { SectionBlock } from '~/composables/usePageDocument'

const props = defineProps<{
  block: SectionBlock
}>()

const emit = defineEmits<{
  updateProps: [props: Record<string, string>]
}>()

const def = computed(() => catalogEntryForTag(props.block.tag))

const editorView = computed(() => {
  if (!isSectionBlockTag(props.block.tag)) return null
  const resolved = resolveComponent(editorComponentName(props.block.tag))
  return typeof resolved === 'string' ? null : resolved
})

const PERSIST_DEBOUNCE_MS = 300
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
</script>

<template>
  <component
    :is="editorView"
    v-if="editorView"
    v-bind="block.props"
    @update:props="emit('updateProps', $event)"
  />
  <UCard
    v-else-if="def.allowedProps.length"
    :ui="{ body: 'space-y-3 p-4' }"
  >
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
      <UInput
        v-model="draft[key]"
        :placeholder="String(def.defaultProps[key] ?? '')"
        @update:model-value="schedulePersist"
        @blur="persist"
      />
    </UFormField>
  </UCard>
</template>
