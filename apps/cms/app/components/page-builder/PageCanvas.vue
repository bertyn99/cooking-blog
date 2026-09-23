<script setup lang="ts">
import type { PageBlockDefinition } from '#shared/content-blocks/catalog'
import type { PageBlock, SectionBlock } from '~/composables/usePageDocument'

const props = defineProps<{
  blocks: PageBlock[]
  palette: PageBlockDefinition[]
  loading?: boolean
}>()

const emit = defineEmits<{
  insert: [tag: string]
  remove: [id: string]
  move: [id: string, direction: -1 | 1]
  updateProps: [block: SectionBlock, props: Record<string, string>]
  updateProse: [id: string, markdown: string]
}>()

const selectedId = shallowRef<string | null>(null)

const selectedBlock = computed(() =>
  props.blocks.find(block => block.id === selectedId.value) ?? null,
)

watch(
  () => props.blocks.map(block => block.id).join(','),
  (ids) => {
    if (selectedId.value && !ids.split(',').includes(selectedId.value)) {
      selectedId.value = null
    }
  },
)

function selectBlock(id: string) {
  selectedId.value = id
}
</script>

<template>
  <div class="space-y-4 p-4">
    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="item in palette"
        :key="item.tag"
        size="xs"
        variant="soft"
        :icon="item.icon"
        :label="item.label"
        @click="emit('insert', item.tag)"
      />
    </div>

    <div v-if="loading" class="space-y-3">
      <USkeleton class="h-20 w-full" />
      <USkeleton class="h-20 w-full" />
    </div>

    <p v-else-if="blocks.length === 0" class="text-sm text-muted">
      Aucun bloc. Ajoutez une section ou passez en vue éditeur.
    </p>

    <div v-else class="space-y-3">
      <div
        v-for="(block, index) in blocks"
        :key="block.id"
        class="group relative"
      >
        <div
          class="absolute right-2 top-2 z-10 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          @click.stop
        >
          <UButton
            icon="i-lucide-arrow-up"
            size="xs"
            variant="ghost"
            aria-label="Monter"
            :disabled="index === 0"
            @click="emit('move', block.id, -1)"
          />
          <UButton
            icon="i-lucide-arrow-down"
            size="xs"
            variant="ghost"
            aria-label="Descendre"
            :disabled="index === blocks.length - 1"
            @click="emit('move', block.id, 1)"
          />
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            color="error"
            variant="ghost"
            aria-label="Supprimer"
            @click="emit('remove', block.id)"
          />
        </div>
        <div
          class="w-full text-left"
          @click="selectBlock(block.id)"
          @focusin="selectBlock(block.id)"
        >
          <PageBuilderBlockFrame
            :block="block"
            :selected="selectedId === block.id"
            @update-prose="(id, markdown) => emit('updateProse', id, markdown)"
          />
        </div>
      </div>

      <PageBuilderBlockInspector
        v-if="selectedBlock?.kind === 'section'"
        :block="selectedBlock"
        @update-props="(next) => emit('updateProps', selectedBlock, next)"
      />
    </div>
  </div>
</template>
