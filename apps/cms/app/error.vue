<script setup lang="ts">
import type { NuxtError } from '#app'
import { computed } from 'vue'
import { getErrorCode } from '../shared/error-code'

const props = defineProps<{
  error: NuxtError
}>()

const errorCode = computed(() => getErrorCode(props.error))

useSeoMeta({
  title: 'Erreur',
  description: 'Une erreur est survenue.',
})
</script>

<template>
  <UApp>
    <UError :error="error" />
    <p v-if="errorCode" class="mt-3 text-center text-sm text-muted">
      Code d’erreur : {{ errorCode }}
    </p>
  </UApp>
</template>
