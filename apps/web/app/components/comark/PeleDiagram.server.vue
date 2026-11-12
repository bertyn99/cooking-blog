<script setup lang="ts">
/**
 * Server-only Mermaid → SVG renderer (Nuxt server component / island).
 *
 * A `.server.vue` component keeps Pele (≈1 MB raw, all diagram types) out of
 * the client bundle: the diagram is drawn once during SSR and the resulting
 * markup is never hydrated. A plain Vue component would ship the whole
 * renderer to every visitor, even on pages without a single diagram.
 *
 * Pele's measured-size layout is deterministic server-side, so the static SVG
 * stays responsive (it carries `max-width:100%;height:auto`). No client-side
 * `mount()` means no resize re-render and no pinch-zoom — acceptable for
 * editorial diagrams, and the trade is a ~350 kB gzip payload.
 *
 * Theming: the CSS variables live on `.pele-diagram` in
 * `app/assets/css/index.css` (see https://pele.run/theming).
 */
import {
  diagramInnerHtml,
  nextIdPrefix,
  renderDiagram,
  WRAPPER_CLASS,
} from 'comark-pele/render'

const props = defineProps<{
  content: string
  class?: string
}>()

const rendered = renderDiagram(props.content, {
  idPrefix: nextIdPrefix(),
})
const html = diagramInnerHtml(rendered, props.content)
</script>

<template>
  <div
    :class="[WRAPPER_CLASS, props.class]"
    :data-diagram="rendered.result?.type"
    :data-error="rendered.error?.message"
    v-html="html"
  />
</template>
