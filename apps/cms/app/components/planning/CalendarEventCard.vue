<script setup lang="ts">
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
      return { icon: 'i-lucide-newspaper', label: 'Article', dotClass: 'bg-primary' }
    case 'recipes':
      return { icon: 'i-lucide-utensils', label: 'Recette', dotClass: 'bg-warning' }
    case 'pages':
      return { icon: 'i-lucide-file-text', label: 'Page', dotClass: 'bg-info' }
  }
})

const statusMeta = computed(() => {
  switch (props.item.status) {
    case 'published':
      return { label: 'Publié', color: 'success' as const }
    case 'scheduled':
      return { label: 'Planifié', color: 'warning' as const }
    default:
      return { label: 'Brouillon', color: 'neutral' as const }
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

const tooltipText = computed(() => {
  const parts = [`${typeMeta.value.label} — ${props.item.title}`]
  if (timeLabel.value) {
    parts.push(timeLabel.value)
  }
  if (!props.item.draggable) {
    parts.push('publication figée, non déplaçable')
  }
  return parts.join(' · ')
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
  <UTooltip :text="tooltipText" :delay-duration="300">
    <button
      type="button"
      class="group flex w-full cursor-pointer flex-col gap-0.5 rounded-md border border-default bg-default/80 px-1.5 py-1 text-left text-xs shadow-sm transition hover:bg-elevated"
      :class="[
        item.draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer opacity-90',
        compact ? 'py-0.5' : '',
      ]"
      :draggable="item.draggable"
      :aria-label="tooltipText"
      @click.stop="onClick"
      @dragstart="onDragStart"
    >
      <span class="flex min-w-0 items-center gap-1.5">
        <span
          class="size-1.5 shrink-0 rounded-full"
          :class="typeMeta.dotClass"
          aria-hidden="true"
        />
        <span class="line-clamp-1 font-medium text-highlighted">{{ item.title }}</span>
        <UIcon
          v-if="!item.draggable"
          name="i-lucide-lock"
          class="ml-auto size-3 shrink-0 text-dimmed"
          aria-hidden="true"
        />
      </span>
      <span class="flex items-center gap-1 text-[10px] text-muted">
        <UBadge :color="statusMeta.color" variant="subtle" size="xs" :label="statusMeta.label" />
        <span v-if="timeLabel" class="tabular-nums">{{ timeLabel }}</span>
      </span>
    </button>
  </UTooltip>
</template>
