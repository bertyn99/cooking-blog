<script setup lang="ts">
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'
import JdcSectionHeading from '../../app/components/JdcSectionHeading.vue'
import { catalogEntryForTag } from '../../shared/content-blocks/catalog'
import { resolveSectionProps } from '../../shared/content-blocks/schema'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  recipesHref?: string
  techniquesHref?: string
  africaHref?: string
  journalHref?: string
}>()

const def = catalogEntryForTag('hubs')

const resolved = computed(() =>
  resolveSectionProps(def.fields, {
    recipesHref: props.recipesHref,
    techniquesHref: props.techniquesHref,
    africaHref: props.africaHref,
    journalHref: props.journalHref,
  }),
)

function slotFallback(name: string): string {
  return def.slots.find(slot => slot.name === name)?.default ?? ''
}

const items = computed(() => [
  {
    href: resolved.value.recipesHref,
    title: 'Recettes',
    text: 'Plats africains et de saison, pas à pas.',
  },
  {
    href: resolved.value.techniquesHref,
    title: 'Techniques',
    text: 'Gestes, cuissons, bases de cuisine.',
  },
  {
    href: resolved.value.africaHref,
    title: 'Recettes du monde',
    text: 'Saveurs d’ailleurs, au-delà du quotidien.',
  },
  {
    href: resolved.value.journalHref,
    title: 'Le journal',
    text: 'Notes, saisons, coulisses du fourneau.',
  },
])
</script>

<template>
  <JdcPublicSurface>
    <UPageSection
      as="section"
      :ui="{
        container: 'gap-8 py-16 sm:py-20 lg:py-20',
      }"
    >
      <div class="w-full">
        <JdcSectionHeading v-if="$slots.title || slotFallback('title')">
          <slot name="title">
            {{ slotFallback('title') }}
          </slot>
        </JdcSectionHeading>

        <UPageGrid
          :ui="{
            base: 'relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 sm:gap-10 xl:gap-12',
          }"
        >
          <UPageCard
            v-for="item in items"
            :key="item.title"
            variant="naked"
            class="group"
            :to="item.href || undefined"
            :title="item.title"
            :description="item.text"
            :ui="{
              root: 'rounded-none',
              container: 'gap-2 border-t border-default p-0 py-8 sm:p-0 sm:py-8',
              title: 'jdc-serif text-2xl font-normal transition-colors duration-200 group-hover:text-yellow-800',
              description: 'text-base leading-relaxed text-toned',
            }"
          />
        </UPageGrid>
      </div>
    </UPageSection>
  </JdcPublicSurface>
</template>
