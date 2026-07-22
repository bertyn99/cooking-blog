<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
import {
  CALENDAR_TIME_ZONE,
  DEFAULT_PUBLISH_HOUR,
  calendarDayKeyFromParts,
} from '#shared/calendar'
import { scheduledAtIsoForDay } from '~/composables/usePublishingCalendar'

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: [dayKey: string]
  cancel: []
}>()

function calendarDateFromToday(): CalendarDate {
  const now = new Date()
  return new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

function calendarDateToParisLabel(date: CalendarDate): string {
  const js = new Date(Date.UTC(date.year, date.month - 1, date.day, 12, 0, 0))
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: CALENDAR_TIME_ZONE,
  }).format(js)
}

const selectedDate = shallowRef(calendarDateFromToday())

const selectedDayKey = computed(() =>
  calendarDayKeyFromParts(
    selectedDate.value.year,
    selectedDate.value.month,
    selectedDate.value.day,
  ),
)

const formattedDate = computed(() => calendarDateToParisLabel(selectedDate.value))

const isPastSlot = computed(() =>
  new Date(scheduledAtIsoForDay(selectedDayKey.value)).getTime() < Date.now(),
)

function selectToday() {
  selectedDate.value = calendarDateFromToday()
}

function shiftSelectedDays(offset: number) {
  const base = selectedDate.value
  const js = new Date(base.year, base.month - 1, base.day)
  js.setDate(js.getDate() + offset)
  selectedDate.value = new CalendarDate(js.getFullYear(), js.getMonth() + 1, js.getDate())
}

function onConfirm() {
  emit('confirm', selectedDayKey.value)
}
</script>

<template>
  <div class="flex w-[min(100vw-2rem,24rem)] flex-col gap-4 p-4">
    <div class="space-y-1">
      <p class="text-sm font-semibold text-highlighted">
        Planifier la publication
      </p>
      <p class="text-xs text-muted">
        Choisissez le jour de mise en ligne sur le site.
      </p>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <UButton
        type="button"
        size="xs"
        color="neutral"
        variant="subtle"
        label="Aujourd’hui"
        @click="selectToday"
      />
      <UButton
        type="button"
        size="xs"
        color="neutral"
        variant="subtle"
        label="Demain"
        @click="shiftSelectedDays(1)"
      />
      <UButton
        type="button"
        size="xs"
        color="neutral"
        variant="subtle"
        label="Dans 7 jours"
        @click="shiftSelectedDays(7)"
      />
    </div>

    <div class="overflow-hidden rounded-xl border border-default bg-elevated/40 p-1">
      <UCalendar
        v-model="selectedDate"
        locale="fr-FR"
        :week-starts-on="1"
        color="primary"
        variant="subtle"
        :fixed-weeks="false"
        prevent-deselect
        class="w-full"
      />
    </div>

    <div
      class="rounded-xl border px-3.5 py-3"
      :class="isPastSlot ? 'border-warning/40 bg-warning/5' : 'border-default bg-default'"
    >
      <div class="flex items-start gap-2.5">
        <UIcon
          :name="isPastSlot ? 'i-lucide-zap' : 'i-lucide-clock'"
          class="mt-0.5 size-4 shrink-0"
          :class="isPastSlot ? 'text-warning' : 'text-muted'"
        />
        <div class="min-w-0 space-y-1">
          <p class="text-sm font-medium text-highlighted capitalize">
            {{ formattedDate }}
          </p>
          <p class="text-xs leading-relaxed text-muted">
            <template v-if="isPastSlot">
              Cette date est déjà passée : le contenu sera publié au prochain passage du planificateur (environ 5 minutes).
            </template>
            <template v-else>
              Publication prévue à {{ DEFAULT_PUBLISH_HOUR }}h, fuseau {{ CALENDAR_TIME_ZONE }}.
            </template>
          </p>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-2 border-t border-default pt-3">
      <UButton
        type="button"
        label="Annuler"
        color="neutral"
        variant="outline"
        @click="emit('cancel')"
      />
      <UButton
        type="button"
        label="Planifier"
        icon="i-lucide-calendar-check"
        :loading="loading"
        @click="onConfirm"
      />
    </div>
  </div>
</template>
