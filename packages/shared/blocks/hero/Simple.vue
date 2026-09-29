<script setup lang="ts">
import BlockSimpleChrome from '../../app/components/BlockSimpleChrome.vue'

defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  image?: string
}>(), {
  image: '/img/hero.jpg',
})
</script>

<template>
  <BlockSimpleChrome tag="hero">
    <BlockHeroClient
      v-bind="$props"
      class="min-h-[10rem] sm:min-h-[12rem] lg:min-h-[14rem]"
    />
  </BlockSimpleChrome>
</template>
