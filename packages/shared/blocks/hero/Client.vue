<script setup lang="ts">
import JdcCoverMedia from '../../app/components/JdcCoverMedia.vue'
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'
import { catalogEntryForTag } from '../../shared/content-blocks/catalog'
import { resolveSectionProps } from '../../shared/content-blocks/schema'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  image?: string
  alt?: string
}>()

const heroDef = catalogEntryForTag('hero')

const resolved = computed(() =>
  resolveSectionProps(heroDef.fields, {
    image: props.image,
    alt: props.alt,
  }),
)
</script>

<template>
  <JdcPublicSurface>
    <div class="relative isolate min-h-[28rem] overflow-hidden sm:min-h-[32rem] lg:min-h-[36rem]">
      <JdcCoverMedia
        v-if="resolved.image"
        :src="resolved.image"
        :alt="resolved.alt"
        :width="1920"
        :height="1080"
        sizes="sm:100vw md:100vw lg:100vw xl:100vw"
        img-class="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div class="mx-auto max-w-7xl px-14 py-32 sm:py-48 lg:py-56">
        <div class="max-w-2xl space-y-4 text-white">
          <h1
            v-if="$slots.title"
            class="pb-1 font-[merriweather] text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl"
          >
            <slot name="title" />
          </h1>
          <p
            v-if="$slots.description"
            class="max-w-[65ch] text-base leading-relaxed text-white/90 sm:text-lg"
          >
            <slot name="description" />
          </p>
          <div
            v-if="$slots.cta"
            class="pt-2"
          >
            <UButton
              color="primary"
              size="lg"
              class="bg-yellow-600 text-white hover:bg-yellow-500"
            >
              <slot name="cta" />
            </UButton>
          </div>
        </div>
        <slot />
      </div>
    </div>
  </JdcPublicSurface>
</template>
