<script lang="ts" setup></script>

<template>
  <div class="-translate-y-1/3">
    <div
      class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 py-8 sm:py-16 lg:py-20 bg-white shadow-md"
    >
      <div
        class="max-w-xl text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:col-span-7"
      >
        <h2 class="inline sm:block lg:inline xl:block">
          Tu veux recevoir les dernières recettes ?
        </h2>
        {{ " " }}
        <p class="inline sm:block lg:inline xl:block">
          Inscris-toi à notre newsletter pour ne rien rater !
        </p>
      </div>
      <form class="w-full max-w-md lg:col-span-5 lg:pt-2">
        <div class="flex gap-x-4">
          <label for="email-address" class="sr-only">Email address</label>
          <input
            id="email-address"
            name="email"
            type="email"
            autocomplete="email"
            required
            class="min-w-0 flex-auto rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-600 sm:text-sm sm:leading-6"
            placeholder="Enter your email"
          />
          <button
            type="submit"
            class="flex-none rounded-md bg-yellow-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
          >
            Inscrire-toi
          </button>
        </div>
        <p class="mt-4 text-sm leading-6 text-gray-900">
          Vous pouvez vous
          désinscrire à tout moment. Pour plus d'informations, consultez notre
          <a
            href="#"
            class="font-semibold text-yellow-600 hover:text-yellow-500"
            >politique de confidentialité</a
          >.
        </p>
      </form>
    </div>
  </div>
</template>
