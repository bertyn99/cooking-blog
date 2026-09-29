<script setup lang="ts">
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

type CalloutType = 'info' | 'tip' | 'warning'

const type = computed({
  get: () => (props.node.attrs.type as CalloutType) || 'info',
  set: (value: CalloutType) => {
    props.updateAttributes({ type: value })
  },
})

const typeMeta: Record<CalloutType, {
  label: string
  icon: string
  shell: string
  badge: string
}> = {
  info: {
    label: 'Info',
    icon: 'i-lucide-info',
    shell: 'border-amber-500/40 bg-amber-50/80 dark:border-amber-400/30 dark:bg-amber-950/25',
    badge: 'bg-amber-500/15 text-amber-800 ring-amber-500/20 dark:text-amber-200',
  },
  tip: {
    label: 'Astuce',
    icon: 'i-lucide-lightbulb',
    shell: 'border-emerald-500/40 bg-emerald-50/80 dark:border-emerald-400/30 dark:bg-emerald-950/25',
    badge: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/20 dark:text-emerald-200',
  },
  warning: {
    label: 'Attention',
    icon: 'i-lucide-triangle-alert',
    shell: 'border-rose-500/40 bg-rose-50/80 dark:border-rose-400/30 dark:bg-rose-950/25',
    badge: 'bg-rose-500/15 text-rose-800 ring-rose-500/20 dark:text-rose-200',
  },
}

const typeItems = (Object.keys(typeMeta) as CalloutType[]).map(value => ({
  label: typeMeta[value].label,
  value,
}))

const meta = computed(() => typeMeta[type.value] ?? typeMeta.info)
</script>

<template>
  <NodeViewWrapper data-type="callout">
    <div
      class="cms-editor-callout my-5 overflow-hidden rounded-xl border border-l-[3px] shadow-sm"
      :class="meta.shell"
    >
      <div
        class="cms-editor-block-chrome flex items-center gap-2 border-b border-inherit/40 px-3 py-2"
        contenteditable="false"
      >
        <span
          class="inline-flex size-7 items-center justify-center rounded-lg ring-1"
          :class="meta.badge"
        >
          <UIcon
            :name="meta.icon"
            class="size-3.5"
          />
        </span>
        <span class="text-xs font-semibold tracking-tight text-highlighted">
          Encadré
        </span>
        <USelect
          v-model="type"
          :items="typeItems"
          value-key="value"
          size="xs"
          class="ml-auto w-36"
        />
      </div>

      <div class="cms-editor-callout__content flex items-start gap-3 px-3 py-3 sm:px-4">
        <span
          class="cms-editor-callout__preview-icon mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md ring-1"
          :class="meta.badge"
          aria-hidden="true"
        >
          <UIcon
            :name="meta.icon"
            class="size-3.5"
          />
        </span>
        <NodeViewContent />
      </div>
    </div>
  </NodeViewWrapper>
</template>
