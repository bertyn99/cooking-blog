<script setup lang="ts">
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

defineProps(nodeViewProps)
</script>

<template>
  <NodeViewWrapper data-type="grid-column">
    <div
      class="cms-editor-grid-column group/col relative flex min-h-[9rem] min-w-0 w-full flex-col rounded-lg bg-default/80 ring-1 ring-default/70 transition-[box-shadow,ring-color] hover:ring-primary/25"
      style="min-width: 0; width: 100%;"
    >
      <div
        class="cms-editor-block-chrome flex items-center gap-1 border-b border-default/50 px-1.5 py-1"
        contenteditable="false"
      >
        <button
          type="button"
          class="inline-flex size-6 cursor-grab items-center justify-center rounded-md text-muted hover:bg-elevated hover:text-default active:cursor-grabbing"
          data-drag-handle
          aria-label="Déplacer la colonne"
          title="Déplacer la colonne"
          draggable="true"
        >
          <UIcon
            name="i-lucide-grip-vertical"
            class="size-3.5"
          />
        </button>
        <span class="text-[10px] font-medium uppercase tracking-wide text-muted">
          Colonne
        </span>
      </div>

      <NodeViewContent class="cms-editor-grid-column__body" />
    </div>
  </NodeViewWrapper>
</template>
