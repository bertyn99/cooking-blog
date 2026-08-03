<script lang="ts" setup>
import ComarkProseImg from "~/components/comark/ProseImg.vue";

defineProps<{
  src?: string;
  alt?: string;
  title?: string;
  width?: string | number;
  height?: string | number;
}>();
</script>

<template>
  <ComarkProseImg v-bind="$props" />
</template>
