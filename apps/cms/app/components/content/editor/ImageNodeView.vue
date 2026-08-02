<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import {
  contentImageClassList,
  isLikelyBrokenContentImageSrc,
} from '#shared/content-image'

const props = defineProps(nodeViewProps)

const src = computed(() => String(props.node.attrs.src ?? ''))
const alt = computed(() => String(props.node.attrs.alt ?? ''))
const title = computed(() => {
  const t = props.node.attrs.title
  return typeof t === 'string' ? t : null
})

/** Orphan path, empty src, or load failure flag for an otherwise-valid URL. */
const isBroken = computed(() => {
  if (isLikelyBrokenContentImageSrc(src.value)) return true
  return props.node.attrs['data-broken'] === 'true' || props.node.attrs['data-broken'] === true
})

const imageClass = computed(() => contentImageClassList(title.value))

const shortSrc = computed(() => {
  const s = src.value
  if (s.length <= 56) return s
  return `${s.slice(0, 28)}…${s.slice(-24)}`
})

function onImgError() {
  if (!props.node.attrs['data-broken']) {
    props.updateAttributes({ 'data-broken': 'true' })
  }
}

function onImgLoad() {
  if (props.node.attrs['data-broken']) {
    props.updateAttributes({ 'data-broken': null })
  }
}

watch(src, (next, prev) => {
  if (next === prev) return
  if (!props.node.attrs['data-broken']) return
  if (!isLikelyBrokenContentImageSrc(next)) {
    props.updateAttributes({ 'data-broken': null })
  }
})
</script>

<template>
  <NodeViewWrapper>
    <div
      class="cms-editor-image-wrap relative my-3 block w-full max-w-full"
      data-drag-handle
    >
      <div
        v-if="isBroken"
        class="flex w-full flex-col gap-2 rounded-xl border border-dashed border-orange-300/90 bg-orange-50/60 px-4 py-5 dark:border-orange-700/50 dark:bg-orange-950/20"
        contenteditable="false"
      >
        <div class="inline-flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <UIcon
            name="i-lucide-image-off"
            class="size-4 shrink-0"
          />
          <span class="text-xs font-semibold tracking-tight">
            Image manquante
          </span>
        </div>
        <p
          v-if="alt"
          class="text-sm leading-snug text-toned"
        >
          {{ alt }}
        </p>
        <p
          v-if="src"
          class="truncate font-mono text-[11px] text-muted"
          :title="src"
        >
          {{ shortSrc }}
        </p>
        <p class="cms-editor-image-hint text-[11px] leading-relaxed text-muted">
          Chemin hors médiathèque. Remplacez l'image depuis la barre d'outils.
        </p>
      </div>
      <img
        v-else
        :src="src"
        :alt="alt"
        :title="title ?? undefined"
        :class="imageClass"
        class="block"
        draggable="false"
        @error="onImgError"
        @load="onImgLoad"
      >
    </div>
  </NodeViewWrapper>
</template>
