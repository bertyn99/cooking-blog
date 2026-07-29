<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <UButton
    color="neutral"
    variant="ghost"
    block
    :square="collapsed"
    to="/"
    class="data-[state=open]:bg-elevated"
  >
    <template #leading>
      <UIcon name="i-lucide-chef-hat" class="size-5 shrink-0 text-primary" />
    </template>
    <span v-if="!collapsed" class="truncate font-semibold">
      Journal du Cuistot
    </span>
  </UButton>
</template>
