<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const formId = useId()
</script>

<template>
  <div class="bg-default px-6 py-10 shadow-sm sm:px-8">
    <div class="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8">
      <div class="max-w-xl text-2xl font-bold tracking-tight text-highlighted sm:text-3xl lg:col-span-7">
        <p>
          Tu veux recevoir les dernières recettes ?
          <span class="font-bold">Inscris-toi à notre newsletter pour ne rien rater !</span>
        </p>
      </div>
      <form
        class="w-full max-w-md lg:col-span-5"
        @submit.prevent
      >
        <div class="flex gap-2">
          <label
            :for="formId"
            class="sr-only"
          >Adresse e-mail</label>
          <UInput
            :id="formId"
            type="email"
            placeholder="Votre e-mail"
            class="min-w-0 flex-1"
          />
          <UButton
            type="submit"
            label="S’inscrire"
          />
        </div>
      </form>
    </div>
  </div>
</template>
