<script lang="ts" setup>
defineProps<{
  code: string,
  language?: string
}>()
</script>

<template>
  <pre class="bg-gray-900 text-white p-4 rounded overflow-auto">
    <code>{{ code }}</code>
  </pre>
</template>