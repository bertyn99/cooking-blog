<script setup lang="ts">
import JdcCoverMedia from '../../app/components/JdcCoverMedia.vue'
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'
import { catalogEntryForTag } from '../../shared/content-blocks/catalog'
import { resolveSectionProps } from '../../shared/content-blocks/schema'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  image?: string
  alt?: string
  ctaHref?: string
  ctaSecondaryHref?: string
}>()

const heroDef = catalogEntryForTag('hero')

const resolved = computed(() =>
  resolveSectionProps(heroDef.fields, {
    image: props.image,
    alt: props.alt,
    ctaHref: props.ctaHref,
    ctaSecondaryHref: props.ctaSecondaryHref,
  }),
)

const slots = useSlots()

const showPrimary = computed(() => Boolean(slots.cta && resolved.value.ctaHref))
const showSecondary = computed(() => Boolean(slots['cta-secondary'] && resolved.value.ctaSecondaryHref))

useHead(() => {
  const src = resolved.value.image
  if (!src?.startsWith('/img/')) return {}
  return {
    link: [{
      rel: 'preload',
      as: 'image',
      href: src,
      fetchPriority: 'high',
    }],
  }
})
</script>

<template>
  <JdcPublicSurface>
    <UPageHero
      as="section"
      class="jdc-hero"
      :ui="{
        root: 'relative isolate overflow-hidden min-h-[34rem] sm:min-h-[40rem] lg:min-h-[min(48rem,85dvh)]',
        container: 'relative z-10 flex min-h-[34rem] flex-col items-start justify-end gap-8 py-16 pt-32 sm:min-h-[40rem] sm:gap-y-10 sm:py-20 sm:pt-36 lg:min-h-[min(48rem,85dvh)] lg:py-24 lg:pt-40',
        wrapper: 'w-full max-w-xl text-left lg:max-w-2xl',
        headline: 'justify-start',
        title: 'jdc-serif text-4xl font-bold tracking-tight text-pretty text-highlighted sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]',
        description: 'max-w-[42ch] text-left text-pretty text-base text-toned sm:text-lg',
        links: 'flex flex-col items-start justify-start gap-3 sm:flex-row sm:items-center sm:gap-x-6',
      }"
    >
      <template
        v-if="resolved.image"
        #top
      >
        <div class="jdc-hero-media pointer-events-none absolute inset-0">
          <JdcCoverMedia
            :src="resolved.image"
            :alt="resolved.alt"
            :width="1920"
            :height="1080"
            sizes="100vw"
            priority
            img-class="jdc-hero-photo"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-neutral-50 from-0% via-neutral-50/90 via-[40%] to-transparent to-[75%] max-md:bg-gradient-to-b max-md:from-neutral-50 max-md:from-0% max-md:via-neutral-50/88 max-md:via-[42%] max-md:to-neutral-50/40" />
        </div>
      </template>
      <template
        v-if="$slots.title"
        #title
      >
        <slot name="title" />
      </template>
      <template
        v-if="$slots.description"
        #description
      >
        <slot name="description" />
      </template>
      <template
        v-if="showPrimary || showSecondary"
        #links
      >
        <UButton
          v-if="showPrimary"
          :to="resolved.ctaHref"
          color="warning"
          size="lg"
          class="rounded-none bg-yellow-600 px-6 text-xs tracking-widest text-white uppercase transition-colors duration-200 hover:bg-yellow-500 active:scale-[0.98]"
        >
          <slot name="cta" />
        </UButton>
        <UButton
          v-if="showSecondary"
          :to="resolved.ctaSecondaryHref"
          variant="link"
          color="neutral"
          size="lg"
          class="px-0 text-sm font-medium tracking-normal normal-case"
        >
          <slot name="cta-secondary" />
        </UButton>
      </template>
      <slot v-if="$slots.default" />
    </UPageHero>
  </JdcPublicSurface>
</template>

<style scoped>
.jdc-hero {
  min-height: 36rem;
}

@media (min-width: 640px) {
  .jdc-hero {
    min-height: 42rem;
  }
}

@media (min-width: 1024px) {
  .jdc-hero {
    min-height: 48rem;
  }
}

.jdc-hero :deep([data-slot='container']) {
  display: flex !important;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  min-height: inherit;
}

.jdc-hero :deep([data-slot='wrapper']) {
  margin-inline-end: auto;
  text-align: left;
}

.jdc-hero :deep([data-slot='links']) {
  justify-content: flex-start;
  align-items: flex-start;
}

.jdc-hero-media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.jdc-hero-media :deep(img),
.jdc-hero-media :deep(picture),
.jdc-hero-media :deep(picture img) {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  object-fit: cover;
  object-position: 70% center;
}

@media (max-width: 640px) {
  .jdc-hero-media :deep(img),
  .jdc-hero-media :deep(picture img) {
    object-position: 80% center;
  }
}
</style>
