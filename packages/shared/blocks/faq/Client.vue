<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'
import JdcSectionHeading from '../../app/components/JdcSectionHeading.vue'
import { catalogEntryForTag } from '../../shared/content-blocks/catalog'
import { parseFaqItems, type JdcFaqItem } from '../../shared/content-blocks/faq'
import { useJdcFaqSchema } from '../../app/composables/useJdcFaqSchema'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** Comark attr — JSON string or parsed array: [{ "question": "…", "answer": "…" }] */
  items?: string | JdcFaqItem[] | null
}>(), {
  items: null,
})

const def = catalogEntryForTag('faq')

function slotFallback(name: string): string {
  return def.slots.find(slot => slot.name === name)?.default ?? ''
}

const faqItems = computed(() => parseFaqItems(props.items))

useJdcFaqSchema(() => faqItems.value)

const accordionItems = computed<AccordionItem[]>(() =>
  faqItems.value.map((item, index) => ({
    label: item.question,
    content: item.answer,
    value: String(index),
  })),
)
</script>

<template>
  <JdcPublicSurface>
    <UPageSection
      v-if="faqItems.length"
      as="section"
      :ui="{
        container: 'gap-6 py-8 sm:py-12 lg:py-12',
      }"
    >
      <div class="w-full">
        <JdcSectionHeading>
          <slot name="title">
            {{ slotFallback('title') }}
          </slot>
        </JdcSectionHeading>
        <UAccordion
          type="multiple"
          :unmount-on-hide="false"
          :items="accordionItems"
          :ui="{
            item: 'border-b border-default last:border-b-0',
            trigger: 'jdc-serif py-4 text-lg font-normal text-highlighted',
            body: 'max-w-[65ch] pb-4 text-[15px] leading-relaxed text-toned',
          }"
        />
      </div>
    </UPageSection>
  </JdcPublicSurface>
</template>
