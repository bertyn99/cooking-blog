<script lang="ts" setup>
const { index, markdown } = defineProps<{
  index: number;
  size: number;
  markdown: string;
}>();
</script>

<template>
  <div
    class="relative before:content-[''] before:absolute before:top-10 before:left-5 before:w-px before:h-full before:bg-amber-200"
    :class="{ 'before:hidden': index === size }"
  >
    <span
      class="absolute top-0 left-0 p-0 m-0 w-10 h-10 text-2xl text-center text-black align-baseline bg-amber-200 rounded-full leading-10"
    >
      {{ index }}
    </span>

    <div class="pt-0 pr-0 pb-12 pl-16 m-0 text-lg leading-6 text-stone-500">
      <Suspense>
        <BaseAppComark :markdown="markdown" class="prose prose-stone max-w-none" />
      </Suspense>
    </div>
  </div>
</template>
