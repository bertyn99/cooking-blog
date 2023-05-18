<script lang="ts" setup>
defineProps({
  data: {
    type: Array,
    required: true,
  },
});
</script>

<template>
  <div class="flex flex-wrap bg-yellow-50 align-baseline items-center">
    <h4
      class="flex-grow-0 flex-shrink-0 lg:basis-1/5 p-5 w-full font-serif text-xl font-normal leading-6 text-center text-black align-baseline break-words bg-amber-200 border-0"
    >
      Nutritional Information
    </h4>

    <div class="flex flex-wrap justify-center py-2 lg:py-0 mx-auto">
      <div
        v-for="nutri in data"
        class="flex flex-col items-center px-2 leading-6 text-center border-0 text-stone-500"
        :key="nutri?.name"
      >
        <span
          class="block font-[merriweather] text-lg font-normal text-black align-baseline border-0"
          >{{ nutri?.value }}{{ nutri?.unit }}</span
        >
        <span class="text-sm text-black align-baseline border-0">{{
          nutri?.name
        }}</span>
      </div>
    </div>
  </div>
</template>
