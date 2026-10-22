<script setup lang="ts">
import { Comment, Fragment, Text, type VNode } from 'vue'
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  cols?: string | number
  variant?: string
}>(), {
  cols: 2,
  variant: 'media',
})

const count = computed((): 1 | 2 | 3 | 4 => {
  const n = Number(props.cols)
  if (!Number.isFinite(n)) return 2
  const clamped = Math.min(4, Math.max(1, Math.trunc(n)))
  return clamped as 1 | 2 | 3 | 4
})

const isCards = computed(() => String(props.variant) === 'cards')

const GRID_COLS = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
} as const

function flattenCells(nodes: VNode[] | undefined): VNode[] {
  const out: VNode[] = []
  for (const node of nodes ?? []) {
    if (!node) continue
    if (node.type === Comment) continue
    if (node.type === Text) {
      if (!String(node.children ?? '').trim()) continue
      out.push(node)
      continue
    }
    if (node.type === Fragment) {
      const children = node.children
      out.push(...flattenCells(Array.isArray(children) ? children as VNode[] : undefined))
      continue
    }
    out.push(node)
  }
  return out
}

const slots = useSlots()
const cells = computed(() => flattenCells(slots.default?.() as VNode[] | undefined))
</script>

<template>
  <JdcPublicSurface>
    <UPageGrid
      v-if="isCards"
      as="div"
      :ui="{
        base: `relative my-6 grid grid-cols-1 gap-6 ${GRID_COLS[count]}`,
      }"
    >
      <UPageCard
        v-for="(cell, i) in cells"
        :key="i"
        variant="outline"
        class="jdc-grid-card h-full"
        :ui="{
          root: 'rounded-none h-full',
          container: 'gap-3 p-6 sm:p-6',
          body: 'jdc-grid-card-body text-base leading-relaxed text-toned',
        }"
      >
        <template #body>
          <component :is="cell" />
        </template>
      </UPageCard>
    </UPageGrid>
    <div
      v-else
      class="my-6 grid grid-cols-1 gap-6"
      :class="GRID_COLS[count]"
    >
      <slot />
    </div>
  </JdcPublicSurface>
</template>

<style scoped>
.jdc-grid-card-body :deep(h3) {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--ui-text-highlighted);
}

.jdc-grid-card-body :deep(p) {
  margin-block: 0.5rem;
}

.jdc-grid-card-body :deep(a) {
  font-weight: 500;
  color: var(--color-yellow-800, #854d0e);
  text-underline-offset: 4px;
}

.jdc-grid-card-body :deep(a:hover) {
  text-decoration: underline;
}

.jdc-grid-card-body :deep(:first-child) {
  margin-top: 0;
}

.jdc-grid-card-body :deep(:last-child) {
  margin-bottom: 0;
}
</style>
