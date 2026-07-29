<script lang="ts" setup>
import { AppComark as ComarkRoot } from "~/utils/app-comark";

defineProps<{
  markdown: string;
  class?: string;
}>();
</script>

<template>
  <ComarkRoot :markdown="markdown" :class="class" />
</template>
