<script setup lang="ts">
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'

interface TimelineItem {
  date?: string
  title?: string
  text?: string
}

function isTimelineItemArray(raw: unknown): raw is TimelineItem[] {
  return Array.isArray(raw)
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw)
  }
  catch {
    return null
  }
}

const props = withDefaults(defineProps<{
  /** Comark attr — JSON string or parsed array: [{ "date": "1680", "title": "…", "text": "…" }] */
  items?: string | TimelineItem[] | null
}>(), {
  items: null,
})

const items = computed<TimelineItem[]>(() => {
  const raw = typeof props.items === 'string' ? safeParse(props.items) : props.items
  if (!isTimelineItemArray(raw)) return []
  return raw.filter((i): i is TimelineItem => !!i && typeof i === 'object' && !!(i.title || i.text || i.date))
})

const timelineItems = computed(() =>
  items.value.map((item, index) => ({
    date: item.date,
    title: item.title,
    description: item.text,
    value: index,
  })),
)
</script>

<template>
  <JdcPublicSurface>
    <UTimeline
      v-if="timelineItems.length"
      class="my-8 w-full"
      color="warning"
      size="md"
      :items="timelineItems"
      :ui="{
        root: 'gap-0',
        item: 'gap-4',
        indicator: 'rounded-none size-2.5 bg-yellow-800 ring-[6px] ring-neutral-50',
        separator: 'rounded-none w-px bg-stone-300 group-last:hidden',
        date: 'jdc-serif text-sm font-bold text-yellow-800',
        title: 'jdc-serif text-lg font-normal text-highlighted',
        description: 'mt-1 max-w-[65ch] text-[15px] leading-relaxed text-toned',
      }"
    />
  </JdcPublicSurface>
</template>
