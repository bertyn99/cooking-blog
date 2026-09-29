<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import type { SectionBlockTag } from '#shared/content-blocks/catalog'

const props = defineProps(nodeViewProps)
const config = useRuntimeConfig()

const tag = computed(() => String(props.extension.options.tag || '') as SectionBlockTag)
const label = computed(() => String(props.extension.options.label || tag.value))
const icon = computed(() => String(props.extension.options.icon || 'i-lucide-box'))
const preview = ref(!props.editor.isEditable)

function syncPreview() {
  preview.value = !props.editor.isEditable
}

onMounted(() => {
  syncPreview()
  props.editor.on('transaction', syncPreview)
})

onBeforeUnmount(() => {
  props.editor.off('transaction', syncPreview)
})

const imageSrc = computed(() => {
  const raw = String(props.node.attrs.image || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//.test(raw)) return raw
  if (raw.startsWith('/img/')) {
    const site = String(config.public.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
    return `${site}${raw}`
  }
  return raw
})

const summary = computed(() => {
  const attrs = props.node.attrs as Record<string, unknown>
  const parts: string[] = []
  for (const key of ['image', 'source', 'category', 'slugs', 'limit'] as const) {
    const value = attrs[key]
    if (value == null || value === '') continue
    parts.push(`${key}=${String(value)}`)
  }
  return parts.join(' · ')
})
</script>

<template>
  <NodeViewWrapper :data-type="tag">
    <div
      class="cms-editor-section overflow-hidden"
      :class="preview ? '' : 'rounded-xl border border-default bg-default shadow-sm'"
    >
      <div
        v-if="!preview"
        class="cms-editor-section-chrome cms-editor-block-chrome flex items-center gap-2 px-3 py-2"
        contenteditable="false"
      >
        <UIcon
          :name="icon"
          class="size-4 text-muted"
        />
        <span class="text-sm font-medium">
          {{ label }}
        </span>
        <span
          v-if="summary"
          class="truncate font-mono text-xs text-muted"
        >
          {{ summary }}
        </span>
      </div>

      <div
        v-if="tag === 'hero'"
        class="relative isolate min-h-[16rem] overflow-hidden sm:min-h-[20rem] lg:min-h-[24rem]"
        :class="preview ? '' : 'rounded-b-xl'"
        contenteditable="false"
      >
        <img
          v-if="imageSrc"
          :src="imageSrc"
          alt=""
          class="absolute inset-0 h-full w-full object-cover"
        >
        <div
          v-else
          class="flex h-full min-h-[16rem] items-center justify-center bg-default text-sm text-muted"
        >
          Bannière
        </div>
      </div>

      <div
        v-else-if="tag === 'newsletter' && preview"
        class="bg-white px-6 py-10 text-neutral-900 shadow-md sm:px-8"
        contenteditable="false"
      >
        <p class="max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
          Tu veux recevoir les dernières recettes ?
          <span class="font-bold">Inscris-toi à notre newsletter pour ne rien rater !</span>
        </p>
      </div>

      <div
        v-else-if="tag === 'recipe-list' && preview"
        class="px-2 py-8 text-center text-sm text-muted"
        contenteditable="false"
      >
        Dernières recettes
      </div>

      <div
        v-else-if="tag === 'article-list' && preview"
        class="px-2 py-8 text-center text-sm text-muted"
        contenteditable="false"
      >
        Derniers articles
      </div>
    </div>
  </NodeViewWrapper>
</template>
