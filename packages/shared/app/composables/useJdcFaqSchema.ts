import type { MaybeRefOrGetter } from 'vue'
import type { JdcFaqItem } from '../../shared/content-blocks/faq'
import { parseFaqItems } from '../../shared/content-blocks/faq'

type FaqSchemaRegister = (items: MaybeRefOrGetter<JdcFaqItem[]>) => void

/**
 * Emits FAQPage + Question on hosts that registered `$jdcFaqSchema`
 * (apps/web via nuxt-schema-org / Unhead). CMS preview no-ops.
 */
export function useJdcFaqSchema(items: MaybeRefOrGetter<string | JdcFaqItem[] | null | undefined>) {
  const nuxtApp = useNuxtApp() as { $jdcFaqSchema?: FaqSchemaRegister }
  const register = nuxtApp.$jdcFaqSchema
  if (typeof register !== 'function') return
  register(() => parseFaqItems(toValue(items)))
}
