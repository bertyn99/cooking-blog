<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  cols?: string | number
}>(), {
  cols: 2,
})

const count = computed(() => {
  const n = Number(props.cols)
  if (!Number.isFinite(n)) return 2
  return Math.min(4, Math.max(1, Math.trunc(n)))
})

const gridClass = computed(() => {
  switch (count.value) {
    case 1:
      return 'md:grid-cols-1'
    case 2:
      return 'md:grid-cols-2'
    case 3:
      return 'md:grid-cols-3'
    case 4:
      return 'md:grid-cols-4'
    default: {
      const _never: never = count.value as never
      return _never
    }
  }
})
</script>

<template>
  <div
    class="my-6 grid grid-cols-1 gap-6"
    :class="gridClass"
  >
    <slot />
  </div>
</template>
