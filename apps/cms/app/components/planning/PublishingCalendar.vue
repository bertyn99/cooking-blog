<script setup lang="ts">
import { today, getLocalTimeZone, type CalendarDate, type DateValue } from '@internationalized/date'
import type { CalendarItem } from '#shared/calendar'
import { calendarDayKeyFromParts } from '#shared/calendar'

const props = defineProps<{
  itemsByDay: Map<string, CalendarItem[]>
  loading?: boolean
}>()

const placeholder = defineModel<CalendarDate>('placeholder', { required: true })

const emit = defineEmits<{
  reschedule: [payload: { key: string; dayKey: string }]
  open: [item: CalendarItem]
}>()

const dragItemKey = ref<string | null>(null)
const dropTargetDay = ref<string | null>(null)

const maxVisibleEvents = 3

const todayDate = today(getLocalTimeZone())

function dayKey(day: DateValue): string {
  return calendarDayKeyFromParts(day.year, day.month, day.day)
}

function isToday(day: DateValue): boolean {
  return day.compare(todayDate) === 0
}

function eventsForDay(day: DateValue): CalendarItem[] {
  return props.itemsByDay.get(dayKey(day)) ?? []
}

function overflowEvents(day: DateValue): CalendarItem[] {
  return eventsForDay(day).slice(maxVisibleEvents)
}

function resolveDragKey(event: DragEvent): string | null {
  return (
    event.dataTransfer?.getData('application/x-cms-calendar-item') ||
    event.dataTransfer?.getData('text/plain') ||
    dragItemKey.value
  )
}

function onDragOver(day: DateValue, event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dropTargetDay.value = dayKey(day)
}

function onDragLeave(day: DateValue) {
  if (dropTargetDay.value === dayKey(day)) {
    dropTargetDay.value = null
  }
}

function onDrop(day: DateValue, event: DragEvent) {
  event.preventDefault()
  const key = resolveDragKey(event)
  dropTargetDay.value = null
  dragItemKey.value = null

  if (!key) {
    return
  }

  emit('reschedule', { key, dayKey: dayKey(day) })
}

// Backlog items use the same drag MIME type; parent resolves the key across calendar + backlog.
</script>

<template>
  <UPageCard title="Calendrier" :ui="{ root: 'min-w-0', body: 'p-0 sm:p-0' }">
    <template #description>
      <p class="text-sm text-muted">
        Glissez les contenus <strong>planifiés</strong> ou les brouillons du panneau latéral. Les
        contenus <strong>publiés</strong> restent visibles mais ne peuvent pas être déplacés.
      </p>
    </template>

    <div class="relative p-2 sm:p-4" :class="loading ? 'opacity-60' : ''">
      <UCalendar
        v-model:placeholder="placeholder"
        :month-controls="false"
        :year-controls="false"
        :view-control="false"
        :week-starts-on="1"
        locale="fr-FR"
        class="w-full"
        :ui="{
          heading: 'sr-only',
          grid: 'w-full',
          gridRow: 'grid-cols-7 gap-px justify-items-stretch',
          cell: 'min-h-0 p-0',
          cellTrigger: [
            'h-auto min-h-[7.5rem] w-full flex-col items-stretch justify-start rounded-md border border-transparent p-1 text-left font-normal',
            'data-[outside-view]:opacity-40 data-[selected]:bg-transparent data-[selected]:text-default',
            'hover:bg-elevated/40',
          ].join(' '),
        }"
      >
        <template #day="{ day }">
          <div
            class="flex h-full min-h-[7rem] w-full flex-col gap-1 rounded-md transition"
            :class="[
              isToday(day) ? 'ring-1 ring-primary/40' : '',
              dropTargetDay === dayKey(day) ? 'bg-primary/5 ring-2 ring-primary/50' : '',
            ]"
            @dragover="onDragOver(day, $event)"
            @dragleave="onDragLeave(day)"
            @drop="onDrop(day, $event)"
          >
            <span
              class="text-xs font-semibold tabular-nums"
              :class="isToday(day) ? 'flex items-center gap-1 text-primary' : 'text-muted'"
            >
              {{ day.day }}
              <UBadge
                v-if="isToday(day)"
                label="Aujourd'hui"
                color="primary"
                variant="subtle"
                size="xs"
                class="hidden xl:inline-flex"
              />
            </span>

            <div class="flex flex-1 flex-col gap-0.5 overflow-hidden">
              <PlanningCalendarEventCard
                v-for="item in eventsForDay(day).slice(0, maxVisibleEvents)"
                :key="`${item.contentType}:${item.id}`"
                compact
                :item="item"
                @open="emit('open', $event)"
              />

              <UPopover v-if="overflowEvents(day).length > 0" :content="{ align: 'start' }">
                <UButton
                  color="primary"
                  variant="ghost"
                  size="xs"
                  class="h-auto px-1 py-0 text-[10px]"
                  :label="`+${overflowEvents(day).length} autre${overflowEvents(day).length > 1 ? 's' : ''}`"
                  @click.stop
                />

                <template #content>
                  <div class="flex max-h-64 w-72 flex-col gap-1 overflow-y-auto p-2">
                    <PlanningCalendarEventCard
                      v-for="item in overflowEvents(day)"
                      :key="`${item.contentType}:${item.id}`"
                      :item="item"
                      @open="emit('open', $event)"
                    />
                  </div>
                </template>
              </UPopover>
            </div>
          </div>
        </template>
      </UCalendar>

      <div
        v-if="loading"
        class="pointer-events-none absolute inset-0 flex items-center justify-center bg-default/30"
      >
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
      </div>
    </div>
  </UPageCard>
</template>
