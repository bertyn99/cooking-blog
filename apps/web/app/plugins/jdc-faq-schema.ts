import type { MaybeRefOrGetter } from 'vue'
import type { JdcFaqItem } from '@journalducuistot/shared/content-blocks'

/**
 * Unhead / nuxt-schema-org FAQ graph for `::faq` and recipe FAQ.
 * Google dropped FAQ rich results (2026-05-07); markup stays valid Schema.org.
 */
export default defineNuxtPlugin(() => {
  function register(items: MaybeRefOrGetter<JdcFaqItem[]>) {
    const list = computed(() => {
      const raw = toValue(items)
      return Array.isArray(raw)
        ? raw.filter(item => item.question.trim() && item.answer.trim())
        : []
    })

    useSchemaOrg(() => {
      if (!list.value.length) return []
      return [
        defineWebPage({
          '@type': 'FAQPage',
        }),
        ...list.value.map(item => defineQuestion({
          name: item.question,
          acceptedAnswer: item.answer,
        })),
      ]
    })
  }

  return {
    provide: {
      jdcFaqSchema: register,
    },
  }
})
