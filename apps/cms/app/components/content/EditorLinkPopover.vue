<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import {
  absolutePublicUrl,
  articlePublicPath,
  externalLinkLabel,
  isExternalHref,
  pagePublicPath,
  recipePublicPath,
  type NestedPageParent,
} from '#shared/public-site-paths'
import { mediaCoverPreviewUrl } from '~/utils/media'
import { applyEditorLink, removeEditorLink } from '~/utils/editor-link'

const props = defineProps<{
  editor: Editor
  /** Open when the caret lands on an existing link (fixed toolbar). */
  autoOpen?: boolean
}>()

const open = defineModel<boolean>('open', { default: false })

type InternalKind = 'articles' | 'pages' | 'recipes'
type LinkMode = InternalKind | 'external'

interface ListRow {
  id: number
  title: string
  slug: string
  status?: string
  coverBlobPathname?: string | null
  cover?: { pathname: string } | null
  category?: { slug: string } | null
  parent?: NestedPageParent | null
  name?: string
}

const mode = ref<LinkMode>('articles')
const search = ref('')
const loading = ref(false)
const externalUrl = ref('')
const linkText = ref('')

const hrefDraft = ref('')
const previewTitle = ref<string | null>(null)
const previewIcon = ref('i-lucide-link')
const previewCover = ref<string | null>(null)

const articles = ref<ListRow[]>([])
const pages = ref<ListRow[]>([])
const recipes = ref<ListRow[]>([])

const { $api } = useNuxtApp()
const config = useRuntimeConfig()
const siteOrigin = computed(() => config.public.siteUrl as string)

const active = computed(() => props.editor.isActive('link'))
const hasTextSelection = computed(() => !props.editor.state.selection.empty)

const disabled = computed(() => {
  if (!props.editor.isEditable) {
    return true
  }
  return props.editor.isActive('image')
})

const internalMode = computed((): InternalKind | null => {
  if (mode.value === 'external') {
    return null
  }
  return mode.value
})

const modeItems = [
  { label: 'Articles', value: 'articles' as const, icon: 'i-lucide-newspaper' },
  { label: 'Pages', value: 'pages' as const, icon: 'i-lucide-file' },
  { label: 'Recettes', value: 'recipes' as const, icon: 'i-lucide-chef-hat' },
  { label: 'URL externe', value: 'external' as const, icon: 'i-lucide-globe' },
]

const previewAbsolute = computed(() => {
  const href = hrefDraft.value.trim()
  if (!href) {
    return ''
  }
  if (isExternalHref(href)) {
    return href
  }
  return absolutePublicUrl(siteOrigin.value, href)
})

const canApply = computed(() => Boolean(hrefDraft.value.trim()))

function rowTitle(row: ListRow) {
  return row.title || row.name || row.slug
}

function rowCoverPath(row: ListRow): string | null {
  return row.coverBlobPathname ?? row.cover?.pathname ?? null
}

function rowHref(kind: InternalKind, row: ListRow): string {
  switch (kind) {
    case 'articles':
      return articlePublicPath(row.slug, row.category?.slug)
    case 'pages':
      return pagePublicPath(row.slug, row.parent ?? null)
    case 'recipes':
      return recipePublicPath(row.slug)
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

function rowIcon(kind: InternalKind): string {
  switch (kind) {
    case 'articles':
      return 'i-lucide-newspaper'
    case 'pages':
      return 'i-lucide-file'
    case 'recipes':
      return 'i-lucide-chef-hat'
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

function setPreviewFromInternal(kind: InternalKind, row: ListRow) {
  hrefDraft.value = rowHref(kind, row)
  previewTitle.value = rowTitle(row)
  previewIcon.value = rowIcon(kind)
  const cover = rowCoverPath(row)
  previewCover.value = cover ? mediaCoverPreviewUrl(cover) : null
  if (!hasTextSelection.value) {
    linkText.value = rowTitle(row)
  }
}

function syncExternalDraft() {
  const raw = externalUrl.value.trim()
  if (!raw) {
    hrefDraft.value = ''
    previewTitle.value = null
    previewCover.value = null
    previewIcon.value = 'i-lucide-globe'
    return
  }
  const href = isExternalHref(raw) ? raw : `https://${raw}`
  hrefDraft.value = href
  previewTitle.value = externalLinkLabel(href)
  previewIcon.value = 'i-lucide-globe'
  previewCover.value = null
  if (!hasTextSelection.value && !linkText.value.trim()) {
    linkText.value = previewTitle.value
  }
}

const currentRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  const source = mode.value === 'articles'
    ? articles.value
    : mode.value === 'pages'
      ? pages.value
      : mode.value === 'recipes'
        ? recipes.value
        : []

  if (!q) {
    return source
  }

  return source.filter((row) => {
    const title = rowTitle(row).toLowerCase()
    return title.includes(q) || row.slug.toLowerCase().includes(q)
  })
})

async function fetchInternalLists() {
  if (articles.value.length || pages.value.length || recipes.value.length) {
    return
  }
  loading.value = true
  try {
    const [articleRes, pageRes, recipeRes] = await Promise.all([
      $api<{ data: ListRow[] }>('/api/articles', {
        query: { pageSize: 80, include: 'category,cover' },
      }),
      $api<{ data: ListRow[] }>('/api/pages', {
        query: { pageSize: 80, include: 'parent' },
      }),
      $api<{ data: ListRow[] }>('/api/recipes', {
        query: { pageSize: 80, include: 'cover' },
      }),
    ])
    articles.value = articleRes.data ?? []
    pages.value = pageRes.data ?? []
    recipes.value = recipeRes.data ?? []
  }
  finally {
    loading.value = false
  }
}

function syncFromEditor() {
  search.value = ''
  linkText.value = ''
  externalUrl.value = ''

  const href = ((props.editor.getAttributes('link').href as string) || '').trim()
  hrefDraft.value = href

  if (!href) {
    previewTitle.value = null
    previewCover.value = null
    previewIcon.value = 'i-lucide-link'
    mode.value = 'articles'
    return
  }

  if (isExternalHref(href)) {
    mode.value = 'external'
    externalUrl.value = href
    syncExternalDraft()
    return
  }

  mode.value = 'articles'
  previewTitle.value = href
  previewIcon.value = 'i-lucide-link'
  previewCover.value = null
}

watch(() => props.editor, (editor, _, onCleanup) => {
  if (!editor) {
    return
  }

  const onSelection = () => {
    if (!open.value) {
      syncFromEditor()
    }
  }

  editor.on('selectionUpdate', onSelection)
  onCleanup(() => editor.off('selectionUpdate', onSelection))
}, { immediate: true })

watch(active, (isActive) => {
  if (isActive && props.autoOpen) {
    open.value = true
  }
})

watch(open, async (isOpen) => {
  if (isOpen) {
    syncFromEditor()
    await fetchInternalLists()
  }
})

watch(externalUrl, () => {
  if (mode.value === 'external') {
    syncExternalDraft()
  }
})

watch(mode, (next, prev) => {
  if (next === 'external' && prev !== 'external') {
    externalUrl.value = isExternalHref(hrefDraft.value) ? hrefDraft.value : ''
    if (externalUrl.value) {
      syncExternalDraft()
    }
  }
  if (next !== 'external') {
    search.value = ''
  }
})

function applyLink() {
  const href = hrefDraft.value.trim()
  if (!href) {
    return
  }
  applyEditorLink(props.editor, {
    href,
    title: hasTextSelection.value
      ? undefined
      : (linkText.value.trim() || previewTitle.value || undefined),
  })
  open.value = false
}

function applyAndCloseFromRow(kind: InternalKind, row: ListRow) {
  setPreviewFromInternal(kind, row)
  applyLink()
}

function removeLink() {
  removeEditorLink(props.editor)
  hrefDraft.value = ''
  externalUrl.value = ''
  open.value = false
}

function openPreviewInNewTab() {
  const href = hrefDraft.value.trim()
  if (!href) {
    return
  }
  const target = isExternalHref(href)
    ? href
    : absolutePublicUrl(siteOrigin.value, href)
  window.open(target, '_blank', 'noopener,noreferrer')
}

function onExternalKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    applyLink()
  }
}
</script>

<template>
  <UPopover
    v-model:open="open"
    :content="{ side: 'bottom', align: 'start' }"
    :ui="{ content: 'p-0 w-[min(100vw-1.25rem,22rem)] sm:w-[26rem]' }"
  >
    <UTooltip text="Lien">
      <UButton
        icon="i-lucide-link"
        color="neutral"
        active-color="primary"
        variant="ghost"
        active-variant="soft"
        size="sm"
        :active="active"
        :disabled="disabled"
      />
    </UTooltip>

    <template #content>
      <div
        class="flex w-full flex-col overflow-hidden bg-default"
        style="max-height: min(26rem, calc(100vh - 6rem));"
      >
        <div class="shrink-0 border-b border-default px-3 py-2">
          <p class="text-sm font-medium text-highlighted">
            Lien
          </p>
          <div
            class="mt-2 flex gap-0.5 rounded-lg bg-elevated/80 p-0.5"
            role="tablist"
            aria-label="Type de lien"
          >
            <UTooltip
              v-for="item in modeItems"
              :key="item.value"
              :text="item.label"
            >
              <UButton
                :icon="item.icon"
                size="xs"
                :color="mode === item.value ? 'primary' : 'neutral'"
                :variant="mode === item.value ? 'soft' : 'ghost'"
                :aria-label="item.label"
                :aria-selected="mode === item.value"
                role="tab"
                @click="mode = item.value"
              />
            </UTooltip>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2">
          <template v-if="internalMode">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              size="sm"
              placeholder="Titre ou slug…"
              class="mb-2"
              :disabled="loading"
            />

            <div
              v-if="loading"
              class="space-y-2"
            >
              <USkeleton
                v-for="index in 4"
                :key="index"
                class="h-11 w-full rounded-md"
              />
            </div>

            <ul
              v-else
              class="space-y-0.5"
              role="listbox"
            >
              <li
                v-for="row in currentRows"
                :key="`${internalMode}-${row.id}`"
              >
                <button
                  type="button"
                  class="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  :class="hrefDraft === rowHref(internalMode, row)
                    ? 'bg-primary/10 ring-1 ring-primary/25'
                    : ''"
                  role="option"
                  :aria-selected="hrefDraft === rowHref(internalMode, row)"
                  @click="applyAndCloseFromRow(internalMode, row)"
                >
                  <div
                    class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-elevated"
                  >
                    <MediaLazyThumb
                      v-if="rowCoverPath(row)"
                      :pathname="rowCoverPath(row)!"
                      variant="picker"
                      img-class="size-full object-cover"
                    />
                    <UIcon
                      v-else
                      :name="rowIcon(internalMode)"
                      class="size-4 text-muted"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium leading-tight text-highlighted">
                      {{ rowTitle(row) }}
                    </p>
                    <p class="truncate text-[11px] text-muted">
                      {{ rowHref(internalMode, row) }}
                      <span
                        v-if="row.status && row.status !== 'published'"
                        class="text-warning"
                      > · {{ row.status }}</span>
                    </p>
                  </div>
                  <UIcon
                    v-if="hrefDraft === rowHref(internalMode, row)"
                    name="i-lucide-check"
                    class="size-3.5 shrink-0 text-primary"
                  />
                </button>
              </li>
              <li
                v-if="!currentRows.length"
                class="py-8 text-center text-sm text-muted"
              >
                Aucun résultat
              </li>
            </ul>
          </template>

          <template v-else>
            <UInput
              v-model="externalUrl"
              icon="i-lucide-link"
              size="sm"
              placeholder="https://exemple.com"
              autofocus
              @keydown="onExternalKeydown"
            />
            <p class="mt-2 text-[11px] leading-relaxed text-muted">
              Saisissez une adresse complète ou un domaine. Entrée pour appliquer.
            </p>
          </template>

          <div
            v-if="!hasTextSelection"
            class="mt-3"
          >
            <label class="mb-1 block text-[11px] font-medium text-muted">
              Texte affiché
            </label>
            <UInput
              v-model="linkText"
              size="sm"
              placeholder="Libellé dans le texte"
            />
          </div>
        </div>

        <div
          v-if="hrefDraft"
          class="shrink-0 border-t border-default bg-default px-3 py-2"
        >
          <div class="flex items-center gap-2 rounded-md bg-elevated/50 px-2 py-2">
            <div
              class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-default"
            >
              <img
                v-if="previewCover"
                :src="previewCover"
                alt=""
                class="size-full object-cover"
              >
              <UIcon
                v-else
                :name="previewIcon"
                class="size-4 text-primary"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-medium text-highlighted">
                {{ previewTitle || hrefDraft }}
              </p>
              <p class="truncate text-[10px] text-muted">
                {{ previewAbsolute }}
              </p>
            </div>
            <UButton
              icon="i-lucide-check"
              color="primary"
              variant="soft"
              size="xs"
              label="Insérer"
              @click="applyLink"
            />
            <UButton
              icon="i-lucide-external-link"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Ouvrir l’aperçu"
              @click="openPreviewInNewTab"
            />
          </div>
        </div>

        <div class="flex shrink-0 items-center justify-between gap-2 border-t border-default bg-default px-3 py-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.35)]">
          <UButton
            v-if="active || hrefDraft"
            label="Retirer"
            color="error"
            variant="ghost"
            size="xs"
            icon="i-lucide-unlink"
            @click="removeLink"
          />
          <span v-else />

          <div class="flex gap-1.5">
            <UButton
              label="Annuler"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="open = false"
            />
            <UButton
              label="Appliquer"
              icon="i-lucide-check"
              color="primary"
              size="sm"
              :disabled="!canApply"
              @click="applyLink"
            />
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>
