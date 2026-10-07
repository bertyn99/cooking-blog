<script setup lang="ts">
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'

interface CarouselImage {
  src?: string
  alt?: string
}

function isCarouselImageArray(raw: unknown): raw is CarouselImage[] {
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
  /** Comark attr — JSON string or parsed array: [{ "src": "uploads/x.png", "alt": "…" }] */
  images?: string | CarouselImage[] | null
}>(), {
  images: null,
})

const index = ref(0)

const images = computed<CarouselImage[]>(() => {
  const raw = typeof props.images === 'string' ? safeParse(props.images) : props.images
  if (!isCarouselImageArray(raw)) return []
  return raw.filter((i): i is CarouselImage => !!i && typeof i === 'object' && !!i.src)
})

function resolvedSrc(path: string): string {
  const clean = path.replace(/^\/+/, '')
  const pathname = clean.startsWith('uploads/') ? clean : `uploads/${clean}`
  return `/images/w_1200,h_800,fit_cover/${pathname}`
}

function go(delta: number) {
  const total = images.value.length
  if (!total) return
  index.value = (index.value + delta + total) % total
}
</script>

<template>
  <JdcPublicSurface>
    <figure
      v-if="images.length"
      class="my-6"
    >
      <div class="relative overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
        <img
          :src="resolvedSrc(images[index]!.src!)"
          :alt="images[index]!.alt ?? ''"
          class="block aspect-[3/2] w-full object-cover"
          loading="lazy"
        >
        <button
          v-if="images.length > 1"
          type="button"
          aria-label="Image précédente"
          class="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2.5 py-1 text-lg leading-none text-neutral-800 shadow-sm transition-colors hover:bg-white"
          @click="go(-1)"
        >
          ‹
        </button>
        <button
          v-if="images.length > 1"
          type="button"
          aria-label="Image suivante"
          class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2.5 py-1 text-lg leading-none text-neutral-800 shadow-sm transition-colors hover:bg-white"
          @click="go(1)"
        >
          ›
        </button>
      </div>
      <figcaption class="mt-2 flex items-start justify-between gap-4">
        <span class="text-sm text-neutral-500">
          {{ images[index]?.alt }}
        </span>
        <span
          v-if="images.length > 1"
          class="flex shrink-0 gap-1.5 pt-1"
          role="tablist"
          aria-label="Choisir l'image"
        >
          <button
            v-for="(img, i) in images"
            :key="`dot-${i}`"
            type="button"
            :aria-label="`Image ${i + 1}`"
            :aria-current="i === index"
            class="h-2 w-2 rounded-full transition-colors"
            :class="i === index ? 'bg-amber-500' : 'bg-stone-300 hover:bg-stone-400'"
            @click="index = i"
          />
        </span>
      </figcaption>
    </figure>
  </JdcPublicSurface>
</template>
