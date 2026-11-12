<script setup lang="ts">
/**
 * `pele` node renderer for Comark (registered in `comark-prose-components.ts`).
 *
 * Thin shell around the server component so Pele's renderer never lands in the
 * client bundle. `inheritAttrs: false` keeps Comark's AST props (`$`, `node`…)
 * away from the island, which only serializes `content` + `class`.
 */
defineOptions({ inheritAttrs: false })

defineProps<{
  content: string
  class?: string
}>()
</script>

<template>
  <ComarkPeleDiagram :content="content" :class="$props.class" />
</template>
