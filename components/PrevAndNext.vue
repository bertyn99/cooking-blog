<script lang="ts" setup></script>

<template>
  <div
    class="flex relative justify-between items-center p-0 my-4 leading-6 align-baseline border-0 text-stone-500"
  >
    <NuxtLink
      itemprop="url"
      class="flex relative items-center h-4 text-black align-baseline border-0 cursor-pointer hover:text-stone-500 after:content-[''] after:absolute after:-z-10 after:w-1/2 after:h-full after:bg-amber-200 after:transition-all after:ease-out hover:after:w-full"
      to="https://easymeals.qodeinteractive.com/recipe/easy-breakfast-meal-prep/"
    >
      <Icon name="heroicons:arrow-long-left-solid" class="h-4 w-4 mr-3 ml-0" />
      <span
        class="block font-sans text-xs font-semibold tracking-widest uppercase align-baseline border-0"
        style="outline: 0px; background-position: 0px center"
        >Previous</span
      >
    </NuxtLink>
    <NuxtLink
      itemprop="url"
      class="flex relative flex-row-reverse items-center h-4 text-black align-baseline border-0 cursor-pointer hover:text-stone-500 after:content-[''] after:absolute after:w-1/2 after:-z-10 after:h-full after:bg-amber-200 after:transition-all after:ease-out hover:after:w-full"
      to="https://easymeals.qodeinteractive.com/recipe/avocado-toast-with-spinach-egg-and-tomatoes/"
    >
      <Icon name="heroicons:arrow-long-right" class="h-4 w-4 mr-0 ml-3" />
      <span
        class="block font-sans text-xs font-semibold tracking-widest uppercase align-baseline border-0"
        >Next</span
      >
    </NuxtLink>
  </div>
</template>
