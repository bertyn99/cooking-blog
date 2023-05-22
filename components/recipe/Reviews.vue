<script lang="ts" setup></script>

<template>
  <div
    class="bg-yellow-50 inline-flex items-center gap-2 px-4 py-2 mt-2.5 mb-6"
  >
    <span
      class="p-0 m-0 font-serif text-base leading-6 text-black align-baseline border-0"
    >
      No Reviews
    </span>

    <div class="flex">
      <Icon
        name="mdi:star-outline"
        class="h-6 w-6 text-amber-200"
        v-for="n in 5"
      />
    </div>
  </div>
</template>
