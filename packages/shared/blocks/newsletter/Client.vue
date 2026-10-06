<script setup lang="ts">
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'
import { catalogEntryForTag } from '../../shared/content-blocks/catalog'

defineOptions({ inheritAttrs: false })

const formId = useId()
const slots = catalogEntryForTag('newsletter').slots

function slotFallback(name: string): string {
  return slots.find(slot => slot.name === name)?.default ?? ''
}
</script>

<template>
  <JdcPublicSurface>
    <UPageSection
      as="section"
      :ui="{
        container: 'py-16 sm:py-16 lg:py-16',
      }"
    >
      <UPageCTA
        variant="soft"
        class="mx-auto max-w-xl rounded-none"
        :ui="{
          root: 'rounded-none bg-elevated ring-1 ring-default',
          container: 'gap-0 px-[12%] py-14 sm:px-[12%] sm:py-16',
          title: 'jdc-serif text-center text-2xl font-normal sm:text-3xl',
          description: 'mx-auto max-w-[40ch] text-center text-sm text-toned',
          body: 'mt-8',
        }"
      >
        <template #title>
          <slot name="title">
            {{ slotFallback('title') }}
          </slot>
        </template>
        <template #description>
          <slot name="subtitle">
            {{ slotFallback('subtitle') }}
          </slot>
        </template>
        <template #body>
          <form
            class="w-full"
            @submit.prevent
          >
            <label
              :for="formId"
              class="sr-only"
            >Adresse e-mail</label>
            <UInput
              :id="formId"
              name="email"
              type="email"
              autocomplete="email"
              required
              placeholder="Votre e-mail"
              class="mb-5 w-full"
              :ui="{
                base: 'rounded-none border-default bg-default px-6 py-4 text-base',
              }"
            />
            <UButton
              type="submit"
              color="neutral"
              block
              class="rounded-none px-10 py-3 text-xs font-semibold tracking-widest uppercase transition-transform duration-200 active:scale-[0.98]"
            >
              <slot name="button">
                {{ slotFallback('button') }}
              </slot>
            </UButton>
            <p class="mt-4 text-left text-xs leading-5 text-toned">
              Vous pouvez vous désinscrire à tout moment. Consultez notre
              <ULink
                raw
                to="/politique-de-confidentialite"
                class="font-semibold text-highlighted underline-offset-2 hover:underline"
              >
                politique de confidentialité
              </ULink>.
            </p>
          </form>
        </template>
      </UPageCTA>
    </UPageSection>
  </JdcPublicSurface>
</template>
