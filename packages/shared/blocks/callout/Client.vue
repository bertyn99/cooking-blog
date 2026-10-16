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
        icon: 'i-lucide-lightbulb',
        label: 'Astuce',
      }
    case 'warning':
      return {
        icon: 'i-lucide-triangle-alert',
        label: 'Attention',
      }
    case 'info':
      return {
        icon: 'i-lucide-info',
        label: 'Info',
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
    <aside :aria-label="appearance.label">
      <UAlert
        class="my-6"
        :icon="appearance.icon"
        color="neutral"
        variant="outline"
        :ui="{
          root: () => 'relative w-full rounded-none border-0 border-s-[3px] border-s-yellow-800 bg-transparent px-5 py-3.5 flex gap-3 items-start',
          wrapper: () => 'min-w-0 flex-1',
          title: () => 'sr-only',
          description: () => 'mt-0 text-[15px] leading-relaxed text-highlighted opacity-100',
          icon: () => 'mt-0.5 size-4 shrink-0 text-yellow-800',
        }"
        :title="appearance.label"
      >
        <template #description>
          <slot />
        </template>
      </UAlert>
    </aside>
  </JdcPublicSurface>
</template>
