<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{
  error: NuxtError
}>()

useSeoMeta({
  title: 'Erreur',
  description: 'Une erreur est survenue.'
})
</script>

<template>
  <UApp>
    <UError :error="error" />
  </UApp>
</template>
