<script lang="ts" setup>
const { markdown, tag = "div" } = defineProps<{
  markdown: string;
  tag?: string;
  class?: string;
}>();
</script>

<template>
  <Suspense>
    <component
      :is="tag"
      v-if="markdown"
      class="w-full prose md:prose-lg lg:prose-xl max-w-4xl"
      :class="$props.class"
    >
      <BaseAppComark :markdown="markdown" />
    </component>
  </Suspense>
</template>
