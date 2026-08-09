<script lang="ts" setup></script>

<template>
  <div class="relative isolate min-h-[28rem] overflow-hidden sm:min-h-[32rem] lg:min-h-[36rem]">
    <NuxtImg
      src="/img/hero.jpg"
      alt=""
      width="1920"
      height="1080"
      sizes="100vw"
      priority
      fetchpriority="high"
      class="absolute inset-0 -z-10 h-full w-full object-cover"
    />

    <div class="mx-auto max-w-7xl py-32 px-14 sm:py-48 lg:py-56">
      <Carrousel></Carrousel>
    </div>
  </div>
</template>
