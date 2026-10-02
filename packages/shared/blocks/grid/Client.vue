<script setup lang="ts">
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  cols?: string | number
}>(), {
  cols: 2,
})

const count = computed((): 1 | 2 | 3 | 4 => {
  const n = Number(props.cols)
  if (!Number.isFinite(n)) return 2
  const clamped = Math.min(4, Math.max(1, Math.trunc(n)))
  return clamped as 1 | 2 | 3 | 4
})

const GRID_COLS = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
} as const
</script>

<template>
  <JdcPublicSurface>
    <div
      class="my-6 grid grid-cols-1 gap-6"
      :class="GRID_COLS[count]"
    >
      <slot />
    </div>
  </JdcPublicSurface>
</template>
