<script setup lang="ts">
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  type?: string
}>(), {
  type: 'info',
})

type CalloutType = 'info' | 'tip' | 'warning'

function normalizeType(raw: string | undefined): CalloutType {
  if (raw === 'tip' || raw === 'warning' || raw === 'info') return raw
  return 'info'
}

const appearance = computed(() => {
  const type = normalizeType(props.type)
  switch (type) {
    case 'tip':
      return {
        color: 'success' as const,
        title: 'Astuce',
        icon: 'i-lucide-lightbulb',
      }
    case 'warning':
      return {
        color: 'error' as const,
        title: 'Attention',
        icon: 'i-lucide-triangle-alert',
      }
    case 'info':
      return {
        color: 'warning' as const,
        title: 'Info',
        icon: 'i-lucide-info',
      }
    default: {
      const _never: never = type
      return _never
    }
  }
})
</script>

<template>
  <JdcPublicSurface>
    <UAlert
      class="my-6"
      :color="appearance.color"
      :icon="appearance.icon"
      :title="appearance.title"
      variant="subtle"
      :ui="{
        root: 'rounded-r-md rounded-l-none border-y-0 border-r-0 border-l-4',
      }"
    >
      <template #description>
        <slot />
      </template>
    </UAlert>
  </JdcPublicSurface>
</template>
