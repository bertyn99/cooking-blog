<script lang="ts" setup>
defineProps<{
  label: string,
  link: string,
  variant?: string // e.g. 'primary' or 'secondary'
}>()
</script>

<template>
  <a
    :href="link"
    class="inline-block px-4 py-2 rounded font-semibold"
    :class="variant === 'secondary' ? 'bg-gray-200 text-gray-800' : 'bg-blue-600 text-white'"
  >
    {{ label }}
  </a>
</template>