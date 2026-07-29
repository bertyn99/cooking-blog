<script setup lang="ts">
import type { CalendarItem } from '#shared/calendar'

defineProps<{
  items: CalendarItem[]
  loading?: boolean
}>()

const emit = defineEmits<{
  open: [item: CalendarItem]
}>()
</script>

<template>
  <UPageCard title="À planifier" class="h-fit lg:sticky lg:top-4">
    <p class="mb-3 text-sm text-muted">
      Brouillons sans date. Glissez-les sur un jour du calendrier pour planifier à 9h (Paris).
    </p>

    <div
      v-if="loading"
      class="space-y-2"
    >
      <USkeleton v-for="index in 4" :key="index" class="h-14 w-full" />
    </div>

    <div
      v-else-if="items.length === 0"
      class="rounded-lg border border-dashed border-default px-3 py-6 text-center text-sm text-muted"
    >
      Aucun brouillon en attente.
    </div>

    <ul v-else class="max-h-[32rem] space-y-2 overflow-y-auto">
      <li v-for="item in items" :key="`${item.contentType}:${item.id}`">
        <PlanningCalendarEventCard :item="item" @open="emit('open', $event)" />
      </li>
    </ul>
  </UPageCard>
</template>
