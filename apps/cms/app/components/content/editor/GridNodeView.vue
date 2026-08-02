<script setup lang="ts">
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { clampGridCols, syncGridColumnCount } from '~/utils/editor-grid-columns'

const props = defineProps(nodeViewProps)

const colCount = computed(() => clampGridCols(props.node.attrs.cols))
const rootEl = ref<HTMLElement | null>(null)

const colOptions = [
  { value: 1, label: '1', aria: '1 colonne' },
  { value: 2, label: '2', aria: '2 colonnes' },
  { value: 3, label: '3', aria: '3 colonnes' },
  { value: 4, label: '4', aria: '4 colonnes' },
] as const

function setCols(n: number) {
  const pos = props.getPos()
  if (typeof pos !== 'number') return

  syncGridColumnCount({
    grid: props.node as ProseMirrorNode,
    gridPos: pos,
    nextCols: n,
    tr: props.editor.state.tr,
    schema: props.editor.schema,
    dispatch: tr => props.editor.view.dispatch(tr),
  })
}

/**
 * TipTap nests the real contentDOM as `[data-node-view-content-vue]` inside
 * NodeViewContent. Utility classes / :style on NodeViewContent are ignored.
 * Force CSS grid on the actual parent of column node views.
 */
function applyGridLayout() {
  const host = rootEl.value
  if (!(host instanceof HTMLElement)) return

  const content
    = host.querySelector<HTMLElement>(':scope > [data-node-view-content] > [data-node-view-content-vue]')
      ?? host.querySelector<HTMLElement>(':scope > [data-node-view-content-vue]')
      ?? host.querySelector<HTMLElement>(':scope > [data-node-view-content]')
  if (!content) return

  const editable = props.editor.isEditable
  content.style.display = 'grid'
  content.style.gridTemplateColumns = `repeat(${colCount.value}, minmax(0, 1fr))`
  content.style.gap = editable ? '0.75rem' : '1.5rem'
  content.style.alignItems = 'stretch'
  content.style.width = '100%'
  content.style.padding = editable ? '0.75rem' : '0'
  content.style.boxSizing = 'border-box'
}

function scheduleApplyGridLayout() {
  nextTick(() => {
    applyGridLayout()
    requestAnimationFrame(applyGridLayout)
  })
}

onMounted(() => {
  scheduleApplyGridLayout()
  const onEditorChange = () => scheduleApplyGridLayout()
  props.editor.on('update', onEditorChange)
  onBeforeUnmount(() => {
    props.editor.off('update', onEditorChange)
  })
})

watch(colCount, scheduleApplyGridLayout)
</script>

<template>
  <!--
    TipTap NodeViewWrapper does not forward class/attrs — put chrome classes
    on an inner host element we control.
  -->
  <NodeViewWrapper data-type="grid">
    <div
      ref="rootEl"
      class="cms-editor-grid group/grid my-5 overflow-hidden rounded-xl border border-default/80 bg-elevated/40 shadow-sm dark:bg-elevated/20"
      :data-cols="colCount"
    >
      <div
        class="cms-editor-block-chrome flex items-center gap-3 border-b border-default/70 bg-default/80 px-3 py-2 backdrop-blur-sm"
        contenteditable="false"
      >
        <div class="flex min-w-0 items-center gap-2">
          <span
            class="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15"
          >
            <UIcon
              name="i-lucide-layout-grid"
              class="size-3.5"
            />
          </span>
          <div class="min-w-0 leading-tight">
            <p class="text-xs font-semibold tracking-tight text-highlighted">
              Grille
            </p>
            <p class="text-[11px] text-muted">
              {{ colCount }} colonne{{ colCount > 1 ? 's' : '' }}
            </p>
          </div>
        </div>

        <div
          class="ml-auto inline-flex items-center rounded-lg bg-elevated p-0.5 ring-1 ring-default"
          role="group"
          aria-label="Nombre de colonnes"
        >
          <button
            v-for="opt in colOptions"
            :key="opt.value"
            type="button"
            class="inline-flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors"
            :class="colCount === opt.value
              ? 'bg-default text-highlighted shadow-sm ring-1 ring-default'
              : 'text-muted hover:text-default'"
            :aria-label="opt.aria"
            :aria-pressed="colCount === opt.value"
            @click="setCols(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <NodeViewContent />
    </div>
  </NodeViewWrapper>
</template>
