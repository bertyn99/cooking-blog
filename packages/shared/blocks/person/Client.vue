<script setup lang="ts">
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'
import { catalogEntryForTag } from '../../shared/content-blocks/catalog'
import { resolveSectionProps } from '../../shared/content-blocks/schema'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  image?: string
  alt?: string
  href?: string
}>()

const def = catalogEntryForTag('person')

const resolved = computed(() =>
  resolveSectionProps(def.fields, {
    image: props.image,
    alt: props.alt,
    href: props.href,
  }),
)

function slotFallback(name: string): string {
  return def.slots.find(slot => slot.name === name)?.default ?? ''
}
</script>

<template>
  <JdcPublicSurface>
    <UPageSection
      as="section"
      :ui="{
        container: 'py-16 sm:py-20 lg:py-24',
      }"
    >
      <div class="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-12">
        <div class="h-32 w-32 shrink-0 overflow-hidden rounded-full ring-4 ring-neutral-50">
          <UAvatar
            v-if="resolved.image"
            :src="resolved.image"
            :alt="resolved.alt"
            size="3xl"
            :ui="{ root: 'h-full w-full' }"
          />
        </div>
        <div class="min-w-0 text-left">
          <p class="mb-3 text-xs font-medium tracking-widest text-toned uppercase">
            A propos de moi
          </p>
          <h2
            v-if="$slots.heading || slotFallback('heading')"
            class="jdc-serif text-2xl font-normal text-pretty text-highlighted sm:text-3xl"
          >
            <slot name="heading">
              {{ slotFallback('heading') }}
            </slot>
          </h2>
          <div
            v-if="$slots.body || slotFallback('body')"
            class="mt-4 max-w-[65ch] text-base leading-relaxed text-toned"
          >
            <slot name="body">
              {{ slotFallback('body') }}
            </slot>
          </div>
          <UButton
            v-if="$slots.cta || slotFallback('cta')"
            :to="resolved.href || undefined"
            variant="link"
            color="neutral"
            trailing-icon="i-lucide-arrow-right"
            class="mt-6 px-0 text-xs font-semibold tracking-widest uppercase"
          >
            <slot name="cta">
              {{ slotFallback('cta') }}
            </slot>
          </UButton>
        </div>
      </div>
    </UPageSection>
  </JdcPublicSurface>
</template>
