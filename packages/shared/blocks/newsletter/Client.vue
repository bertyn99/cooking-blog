<script setup lang="ts">
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'

defineOptions({ inheritAttrs: false })

const formId = useId()
</script>

<template>
  <JdcPublicSurface>
    <div class="-translate-y-1/3">
      <div
        class="mx-auto grid max-w-6xl grid-cols-1 gap-10 bg-white px-6 py-8 shadow-md sm:py-16 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-20"
      >
        <div class="max-w-xl text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:col-span-7">
          <h2 class="inline sm:block lg:inline xl:block">
            Tu veux recevoir les dernières recettes ?
          </h2>
          {{ ' ' }}
          <p class="inline sm:block lg:inline xl:block">
            Inscris-toi à notre newsletter pour ne rien rater !
          </p>
        </div>
        <form
          class="w-full max-w-md lg:col-span-5 lg:pt-2"
          @submit.prevent
        >
          <div class="flex gap-x-4">
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
              placeholder="Enter your email"
              size="lg"
              class="min-w-0 flex-auto"
              :ui="{
                base: 'rounded-md px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-600 sm:text-sm sm:leading-6',
              }"
            />
            <UButton
              type="submit"
              label="Inscrire-toi"
              color="primary"
              size="lg"
              class="flex-none rounded-md bg-yellow-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500"
            />
          </div>
          <p class="mt-4 text-sm leading-6 text-gray-900">
            Vous pouvez vous désinscrire à tout moment. Pour plus d'informations, consultez notre
            <a
              href="#"
              class="font-semibold text-yellow-600 hover:text-yellow-500"
            >politique de confidentialité</a>.
          </p>
        </form>
      </div>
    </div>
  </JdcPublicSurface>
</template>
