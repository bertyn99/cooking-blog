<script setup lang="ts">
import {
  EDITOR_PAGE_DEFAULT_VIEW_KEY,
  parsePageEditorDefaultView,
  type PageEditorDefaultView,
} from '#shared/site-settings-keys'
import { isSectionBlockTag } from '#shared/content-blocks/catalog'
import { usePageDocument } from '~/composables/usePageDocument'

const content = defineModel<string>({ required: true })

const props = defineProps<{
  slug?: string
  isHome?: boolean
  publicPath?: string
}>()

const { $api } = useNuxtApp()
const config = useRuntimeConfig()
const viewOverride = shallowRef<PageEditorDefaultView | null>(null)
const canvasActive = shallowRef(false)

const {
  document,
  parsing,
  palette,
  insertSection,
  removeBlock,
  moveBlock,
  updateSectionProps,
  updateProseMarkdown,
} = usePageDocument(content, { active: canvasActive })

const { data: settings } = await useAsyncData(
  'site-settings',
  () => $api<{ data: Array<{ key: string, value: unknown }> }>('/api/site-settings'),
)

const view = computed({
  get(): PageEditorDefaultView {
    if (viewOverride.value) return viewOverride.value
    const row = settings.value?.data?.find(item => item.key === EDITOR_PAGE_DEFAULT_VIEW_KEY)
    return parsePageEditorDefaultView(row?.value)
  },
  set(value: PageEditorDefaultView) {
    viewOverride.value = value
  },
})

watch(
  view,
  (next) => {
    canvasActive.value = next === 'simple'
  },
  { immediate: true },
)

async function onInsert(tag: string) {
  if (!isSectionBlockTag(tag)) return
  await insertSection(tag)
}

const previewUrl = computed(() => {
  if (!props.slug) return undefined
  const origin = String(config.public.siteUrl || '').replace(/\/$/, '')
  if (!origin) return undefined
  const previewSlug = props.isHome
    ? props.slug
    : (props.publicPath?.replace(/^\//, '') || props.slug)
  return `${origin}/preview?type=page&slug=${encodeURIComponent(previewSlug)}`
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-default px-4 py-2">
      <UTabs
        v-model="view"
        :items="[
          { label: 'Éditeur', value: 'editor' },
          { label: 'Vue simple', value: 'simple' },
        ]"
        size="xs"
      />

      <UButton
        v-if="previewUrl"
        :to="previewUrl"
        target="_blank"
        size="xs"
        variant="ghost"
        icon="i-lucide-external-link"
        label="Prévisualiser"
      />
    </div>

    <ContentMarkdownEditor
      v-if="view === 'editor'"
      v-model="content"
    />

    <PageBuilderPageCanvas
      v-else
      :blocks="document.blocks"
      :palette="palette"
      :loading="parsing"
      @insert="onInsert"
      @remove="removeBlock"
      @move="(id, dir) => moveBlock(id, dir)"
      @update-props="(block, next) => updateSectionProps(block, next)"
      @update-prose="(id, markdown) => updateProseMarkdown(id, markdown)"
    />
  </div>
</template>
