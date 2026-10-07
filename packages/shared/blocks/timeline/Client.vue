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
</script>

<template>
  <JdcPublicSurface>
    <div
      v-if="items.length"
      class="my-8"
    >
      <ol class="ml-2 space-y-8 border-l-2 border-stone-200 pl-6">
        <li
          v-for="(item, i) in items"
          :key="i"
          class="relative"
        >
          <span
            class="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-amber-500 bg-white"
            aria-hidden="true"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-amber-500" />
          </span>
          <p
            v-if="item.date"
            class="font-serif text-sm font-bold tracking-wide text-amber-700"
          >
            {{ item.date }}
          </p>
          <p
            v-if="item.title"
            class="mt-0.5 font-serif text-lg font-bold text-neutral-900"
          >
            {{ item.title }}
          </p>
          <p
            v-if="item.text"
            class="mt-1 text-[15px] leading-relaxed text-neutral-600"
          >
            {{ item.text }}
          </p>
        </li>
      </ol>
    </div>
  </JdcPublicSurface>
</template>
