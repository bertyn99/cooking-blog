<script setup lang="ts">
defineOptions({ inheritAttrs: false })

type CalloutType = 'info' | 'tip' | 'warning'

const props = withDefaults(defineProps<{
  type?: string
}>(), {
  type: 'info',
})

function normalizeType(raw: string | undefined): CalloutType {
  if (raw === 'tip' || raw === 'warning' || raw === 'info') return raw
  return 'info'
}

const appearance = computed(() => {
  const type = normalizeType(props.type)
  switch (type) {
    case 'tip':
      return { color: 'success' as const, icon: 'i-lucide-lightbulb' }
    case 'warning':
      return { color: 'error' as const, icon: 'i-lucide-triangle-alert' }
    case 'info':
      return { color: 'warning' as const, icon: 'i-lucide-info' }
    default: {
      const _never: never = type
      return _never
    }
  }
})
</script>

<template>
  <UAlert
    :color="appearance.color"
    :icon="appearance.icon"
    variant="subtle"
    class="my-4"
  >
    <template #description>
      <slot />
    </template>
  </UAlert>
</template>
