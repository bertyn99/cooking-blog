<script setup lang="ts">
import type { CalendarDate } from '@internationalized/date'
import type { CalendarItem } from '#shared/calendar'

const props = defineProps<{
  item: CalendarItem
  compact?: boolean
}>()

const emit = defineEmits<{
  open: [item: CalendarItem]
}>()

const typeMeta = computed(() => {
  switch (props.item.contentType) {
    case 'articles':
      return { icon: 'i-lucide-newspaper', label: 'Article', color: 'primary' as const }
    case 'recipes':
      return { icon: 'i-lucide-utensils', label: 'Recette', color: 'warning' as const }
    case 'pages':
      return { icon: 'i-lucide-file-text', label: 'Page', color: 'info' as const }
  }
})

const timeLabel = computed(() => {
  if (!props.item.calendarAt) {
    return null
  }
  return new Date(props.item.calendarAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  })
})

function onDragStart(event: DragEvent) {
  if (!props.item.draggable) {
    event.preventDefault()
    return
  }
  const key = `${props.item.contentType}:${props.item.id}`
  event.dataTransfer?.setData('text/plain', key)
  event.dataTransfer?.setData('application/x-cms-calendar-item', key)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onClick() {
  emit('open', props.item)
}
</script>

<template>
  <button
    type="button"
    class="group flex w-full cursor-pointer flex-col gap-0.5 rounded-md border border-default bg-default/80 px-1.5 py-1 text-left text-xs shadow-sm transition hover:bg-elevated"
    :class="[
      item.draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer opacity-90',
      compact ? 'py-0.5' : '',
    ]"
    :draggable="item.draggable"
    :aria-grabbed="item.draggable ? true : undefined"
    :title="item.draggable ? undefined : 'Publication figée — non déplaçable'"
    @click.stop="onClick"
    @dragstart="onDragStart"
  >
    <span class="flex items-center gap-1">
      <UIcon :name="typeMeta.icon" class="size-3 shrink-0 text-dimmed" />
      <span class="line-clamp-1 font-medium text-highlighted">{{ item.title }}</span>
      <UIcon
        v-if="!item.draggable"
        name="i-lucide-lock"
        class="ml-auto size-3 shrink-0 text-dimmed"
      />
    </span>
    <span class="flex items-center gap-1 text-[10px] text-muted">
      <UBadge :color="item.status === 'published' ? 'success' : 'warning'" variant="subtle" size="xs">
        {{ item.status === 'published' ? 'Publié' : 'Planifié' }}
      </UBadge>
      <span v-if="timeLabel">{{ timeLabel }}</span>
    </span>
  </button>
</template>
