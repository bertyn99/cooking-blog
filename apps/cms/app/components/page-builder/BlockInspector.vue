<script setup lang="ts">
import { catalogEntryForTag } from '#shared/content-blocks'
import type { SectionBlock } from '~/composables/usePageDocument'

const props = defineProps<{
  block: SectionBlock
}>()

const emit = defineEmits<{
  updateProps: [props: Record<string, string>]
  updateSlots: [slots: Record<string, string>]
}>()

const def = computed(() => catalogEntryForTag(props.block.tag))

const slotDraft = reactive<Record<string, string>>({})
const PERSIST_DEBOUNCE_MS = 300
let slotTimer: ReturnType<typeof setTimeout> | undefined

function slotStored(name: string, fallback?: string): string {
  const stored = props.block.slots[name]
  if (stored?.trim()) return stored
  return fallback ?? ''
}

function syncSlots() {
  for (const slot of def.value.slots) {
    slotDraft[slot.name] = slotStored(slot.name, slot.default)
  }
}

function persistSlots() {
  if (slotTimer) {
    clearTimeout(slotTimer)
    slotTimer = undefined
  }
  const next: Record<string, string> = {}
  for (const slot of def.value.slots) {
    next[slot.name] = slotDraft[slot.name] ?? ''
  }
  const unchanged = def.value.slots.every((slot) => {
    return (next[slot.name] ?? '') === (props.block.slots[slot.name] ?? '')
  })
  if (unchanged) return
  emit('updateSlots', next)
}

function scheduleSlotPersist() {
  if (slotTimer) clearTimeout(slotTimer)
  slotTimer = setTimeout(persistSlots, PERSIST_DEBOUNCE_MS)
}

watch(
  () => props.block.id,
  (_id, prevId) => {
    if (prevId) persistSlots()
    syncSlots()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  persistSlots()
})
</script>

<template>
  <UCard :ui="{ body: 'space-y-4 p-4' }">
    <div class="flex flex-wrap items-center gap-2">
      <UIcon
        :name="def.icon"
        class="size-4 text-muted"
      />
      <p class="text-sm font-medium text-highlighted">
        {{ def.label }}
      </p>
      <BlockPropBadges
        :fields="def.fields"
        :values="block.props"
      />
    </div>

    <BlockPropsForm
      :key="block.id"
      :definition="def"
      :values="block.props"
      :show-heading="false"
      @update:values="emit('updateProps', $event)"
    />

    <div
      v-if="def.slots.length"
      class="space-y-3 border-t border-default pt-3"
    >
      <div
        v-for="slot in def.slots"
        :key="slot.name"
        class="space-y-1.5"
      >
        <p class="font-mono text-[11px] text-muted">
          # {{ slot.label }}
        </p>
        <UInput
          v-if="slot.input === 'text'"
          v-model="slotDraft[slot.name]"
          :placeholder="slot.placeholder"
          @update:model-value="scheduleSlotPersist"
          @blur="persistSlots"
        />
        <UTextarea
          v-else
          v-model="slotDraft[slot.name]"
          autoresize
          :rows="3"
          :placeholder="slot.placeholder || 'Texte du slot'"
          @update:model-value="scheduleSlotPersist"
          @blur="persistSlots"
        />
      </div>
    </div>
  </UCard>
</template>
