<script setup lang="ts">
import { catalogEntryForTag, isLiftedBlockTag } from '../../shared/content-blocks/catalog'
import type { ContentBlockSlot } from '../../shared/content-blocks/schema'
import BlockPropBadges from './BlockPropBadges.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  tag: string
  values?: Record<string, string | number | boolean | undefined>
  expanded?: boolean
  slotValues?: Record<string, string>
}>(), {
  values: () => ({}),
  expanded: false,
  slotValues: () => ({}),
})

const emit = defineEmits<{
  'update:slotValues': [Record<string, string>]
  'update:values': [Record<string, string>]
}>()

const def = computed(() => {
  if (!isLiftedBlockTag(props.tag)) return null
  return catalogEntryForTag(props.tag)
})

const open = ref(props.expanded)
const openSlots = ref<Record<string, boolean>>({})
const draft = reactive<Record<string, string>>({})
const PERSIST_DEBOUNCE_MS = 300
let persistTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.expanded,
  (expanded) => {
    if (expanded) open.value = true
  },
)

function slotStored(slot: ContentBlockSlot): string {
  return props.slotValues[slot.name] ?? slot.default ?? ''
}

function syncDraft() {
  if (!def.value) return
  for (const slot of def.value.slots) {
    draft[slot.name] = slotStored(slot)
  }
}

function persistSlots() {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = undefined
  }
  if (!def.value) return
  const next: Record<string, string> = {}
  for (const slot of def.value.slots) {
    next[slot.name] = draft[slot.name] ?? ''
  }
  const unchanged = def.value.slots.every((slot) => {
    return (next[slot.name] ?? '') === slotStored(slot)
  })
  if (unchanged) return
  emit('update:slotValues', next)
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(persistSlots, PERSIST_DEBOUNCE_MS)
}

watch(
  def,
  (entry) => {
    if (!entry) return
    const next: Record<string, boolean> = {}
    for (const slot of entry.slots) {
      next[slot.name] = openSlots.value[slot.name] ?? true
    }
    openSlots.value = next
    syncDraft()
  },
  { immediate: true },
)

watch(
  () => props.slotValues,
  () => {
    syncDraft()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  persistSlots()
})

function slotOpen(slot: ContentBlockSlot): boolean {
  return openSlots.value[slot.name] ?? true
}

function setSlotOpen(slot: ContentBlockSlot, value: boolean) {
  openSlots.value = { ...openSlots.value, [slot.name]: value }
}

function slotLabel(slot: ContentBlockSlot): string {
  return `# ${slot.label.toUpperCase()}`
}
</script>

<template>
  <UCollapsible
    v-if="def"
    v-model:open="open"
    :unmount-on-hide="false"
    class="jdc-block-tree w-full rounded-lg border border-default/70 px-2 py-1 text-left"
  >
    <button
      type="button"
      class="flex w-full min-h-9 items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-elevated/60"
    >
      <UIcon
        name="i-lucide-chevron-right"
        class="size-3.5 shrink-0 text-muted transition-transform"
        :class="open ? 'rotate-90' : ''"
      />
      <UIcon
        :name="def.icon"
        class="size-4 shrink-0 text-muted"
      />
      <span class="min-w-0 truncate text-sm font-medium text-highlighted">
        {{ def.label }}
      </span>
      <BlockPropBadges
        :fields="def.fields"
        :values="values"
      />
    </button>

    <template #content>
      <div class="mt-1 space-y-2 border-l border-default pl-3 ml-2">
        <div
          v-if="def.fields.length"
          class="mb-2 space-y-2 py-1"
          @click.stop
        >
          <BlockPropsForm
            :definition="def"
            :values="values"
            :show-heading="false"
            @update:values="emit('update:values', $event)"
          />
        </div>
        <UCollapsible
          v-for="slot in def.slots"
          :key="slot.name"
          :open="slotOpen(slot)"
          :unmount-on-hide="false"
          @update:open="setSlotOpen(slot, $event)"
        >
          <button
            type="button"
            class="flex w-full min-h-8 items-center gap-2 rounded-md px-1 py-0.5 text-left hover:bg-elevated/60"
          >
            <UIcon
              name="i-lucide-chevron-right"
              class="size-3.5 shrink-0 text-muted transition-transform"
              :class="slotOpen(slot) ? 'rotate-90' : ''"
            />
            <span class="font-mono text-[11px] text-muted">
              {{ slotLabel(slot) }}
            </span>
          </button>
          <template #content>
            <div
              class="mt-1 ml-2 space-y-2"
              @click.stop
            >
              <UInput
                v-if="slot.input === 'text'"
                v-model="draft[slot.name]"
                :placeholder="slot.placeholder"
                size="sm"
                @update:model-value="schedulePersist"
                @blur="persistSlots"
              />
              <UTextarea
                v-else
                v-model="draft[slot.name]"
                :placeholder="slot.placeholder || 'Texte du slot'"
                autoresize
                :rows="2"
                @update:model-value="schedulePersist"
                @blur="persistSlots"
              />
              <slot
                v-if="slot.name === 'default'"
              />
              <slot
                v-else
                :name="slot.name"
              />
            </div>
          </template>
        </UCollapsible>

        <div
          v-if="!def.slots.length"
          class="py-1"
        >
          <slot />
        </div>
      </div>
    </template>
  </UCollapsible>
  <div v-else>
    <p class="mb-2 font-mono text-xs text-muted">
      ::{{ tag }}
    </p>
    <slot />
  </div>
</template>
