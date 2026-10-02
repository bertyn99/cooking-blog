<script setup lang="ts">
import type { ContentBlockDefinition, ContentBlockField } from '../../shared/content-blocks/catalog'
import { isFieldVisible } from '../../shared/content-blocks/schema'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  definition: ContentBlockDefinition
  values: Record<string, string | number | boolean>
  showHeading?: boolean
}>(), {
  showHeading: true,
})

const emit = defineEmits<{
  'update:values': [Record<string, string>]
}>()

const PERSIST_DEBOUNCE_MS = 300
const draft = reactive<Record<string, string>>({})
let persistTimer: ReturnType<typeof setTimeout> | undefined

const visibleFields = computed(() =>
  props.definition.fields.filter(field => isFieldVisible(field, draft)),
)

function fieldDefault(field: ContentBlockField): string {
  if (field.default === undefined || field.default === null) return ''
  return String(field.default)
}

function syncDraft() {
  for (const field of props.definition.fields) {
    draft[field.key] = String(props.values[field.key] ?? fieldDefault(field))
  }
}

function snapshot(): Record<string, string> {
  const next: Record<string, string> = {}
  for (const field of props.definition.fields) {
    if (!isFieldVisible(field, draft)) continue
    next[field.key] = draft[field.key] ?? ''
  }
  return next
}

function isUnchanged(next: Record<string, string>): boolean {
  return props.definition.fields.every((field) => {
    if (!isFieldVisible(field, next) && !isFieldVisible(field, props.values)) return true
    const current = String(props.values[field.key] ?? fieldDefault(field))
    return (next[field.key] ?? '') === current
  })
}

function persist() {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = undefined
  }
  const next = snapshot()
  if (isUnchanged(next)) return
  emit('update:values', next)
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(persist, PERSIST_DEBOUNCE_MS)
}

function onSelect(field: ContentBlockField, value: unknown) {
  draft[field.key] = value == null ? '' : String(value)
  persist()
}

function onNumber(field: ContentBlockField, value: number | null) {
  draft[field.key] = value == null ? '' : String(value)
  schedulePersist()
}

function onAlt(field: ContentBlockField, value: string) {
  if (!field.altKey) return
  draft[field.altKey] = value
  persist()
}

function onToggle(field: ContentBlockField, value: boolean) {
  draft[field.key] = value ? 'true' : 'false'
  persist()
}

watch(
  () => props.definition.fields.map(field => String(props.values[field.key] ?? '')).join('\0'),
  () => {
    syncDraft()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  persist()
})
</script>

<template>
  <div class="space-y-3">
    <div v-if="showHeading">
      <p class="text-sm font-medium text-highlighted">
        {{ definition.label }}
      </p>
      <p class="mt-0.5 text-xs text-muted">
        {{ definition.description }}
      </p>
    </div>
    <p
      v-else-if="definition.description"
      class="text-xs text-muted"
    >
      {{ definition.description }}
    </p>

    <p
      v-if="!visibleFields.length"
      class="text-xs text-muted"
    >
      Aucun champ.
    </p>

    <UFormField
      v-for="field in visibleFields"
      :key="field.key"
      :label="field.label"
      :description="field.description"
    >
      <USelect
        v-if="field.input === 'select'"
        :model-value="draft[field.key]"
        :items="field.options ?? []"
        value-key="value"
        @update:model-value="onSelect(field, $event)"
      />
      <UInputNumber
        v-else-if="field.input === 'number'"
        :model-value="Number(draft[field.key] || field.min || 0)"
        :min="field.min"
        :max="field.max"
        @update:model-value="onNumber(field, $event)"
        @blur="persist"
      />
      <USwitch
        v-else-if="field.input === 'toggle'"
        :model-value="draft[field.key] === 'true'"
        @update:model-value="onToggle(field, $event)"
      />
      <UTextarea
        v-else-if="field.input === 'textarea'"
        v-model="draft[field.key]"
        :placeholder="field.placeholder"
        autoresize
        :rows="3"
        @update:model-value="schedulePersist"
        @blur="persist"
      />
      <div
        v-else-if="field.input === 'color'"
        class="flex items-center gap-2"
      >
        <UColorPicker
          :model-value="draft[field.key] || '#ca8a04'"
          format="hex"
          size="sm"
          @update:model-value="onSelect(field, $event)"
        />
        <UInput
          v-model="draft[field.key]"
          :placeholder="field.placeholder ?? '#ca8a04'"
          class="min-w-0 flex-1"
          @update:model-value="schedulePersist"
          @blur="persist"
        />
      </div>
      <BlockMediaField
        v-else-if="field.input === 'media'"
        v-model="draft[field.key]"
        :placeholder="field.placeholder"
        :reset-value="fieldDefault(field)"
        :alt="field.altKey ? draft[field.altKey] : undefined"
        @update:model-value="schedulePersist"
        @update:alt="onAlt(field, $event)"
      />
      <UInput
        v-else
        v-model="draft[field.key]"
        :placeholder="field.placeholder"
        :icon="field.input === 'media' ? 'i-lucide-image' : undefined"
        @update:model-value="schedulePersist"
        @blur="persist"
      />
    </UFormField>
  </div>
</template>
