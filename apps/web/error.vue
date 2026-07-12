<script lang="ts" setup>
const { error } = defineProps({
  error: Object,
});
</script>

<template>
  <div
    class="relative pt-14 m-0 w-full leading-6 text-center align-top text-stone-500 space-y-10"
  >
    <h1 class="font-serif text-8xl font-normal text-center text-black">
      {{ error.statusCode || 404 }}
    </h1>

    <p class="mx-auto mb-0 leading-6 text-center text-stone-500">
      {{ error.messages || "Page not found" }}
    </p>
    <button
      class="inline-block relative py-3 px-10 m-0 w-auto font-sans text-xs font-semibold leading-8 text-center text-white uppercase align-middle bg-black rounded-none border border-transparent border-solid cursor-pointer hover:bg-zinc-800 hover:text-white"
      @click="() => clearError({ redirect: '/' })"
      style="
        outline: 0px;
        text-decoration: none;
        transition: color 0.2s ease-out 0s, background-color 0.2s ease-out 0s,
          border-color 0.2s ease-out 0s;
        background-position: 0px center;
        letter-spacing: 2.4px;
      "
    >
      Retour à l'accueil
    </button>
  </div>
</template>
