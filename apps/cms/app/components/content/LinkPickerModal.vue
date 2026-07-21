<script setup lang="ts">
import {
  absolutePublicUrl,
  articlePublicPath,
  externalLinkLabel,
  isExternalHref,
  pagePublicPath,
  recipePublicPath,
  type NestedPageParent,
} from '#shared/public-site-paths'
import { mediaPublicUrl } from '~/utils/media'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  /** Current link href when editing an existing link */
  initialHref?: string
  /** Whether the editor has a non-empty text selection */
  hasTextSelection?: boolean
}>()

const emit = defineEmits<{
  apply: [payload: { href: string, title?: string }]
  remove: []
}>()

type InternalKind = 'articles' | 'pages' | 'recipes'
type LinkMode = InternalKind | 'external'

interface ListRow {
  id: number
  title: string
  slug: string
  status?: string
  coverBlobPathname?: string | null
  category?: { slug: string } | null
  parent?: NestedPageParent | null
  name?: string
}

const { $api } = useNuxtApp()
const config = useRuntimeConfig()

const mode = ref<LinkMode>('articles')
const search = ref('')
const loading = ref(false)
const externalUrl = ref('')
const linkText = ref('')

const articles = ref<ListRow[]>([])
const pages = ref<ListRow[]>([])
const recipes = ref<ListRow[]>([])

const selectedHref = ref<string | null>(null)
const selectedTitle = ref<string | null>(null)
const selectedIcon = ref<string>('i-lucide-file-text')
const selectedCover = ref<string | null>(null)

const modeItems = [
  { label: 'Articles', value: 'articles' as const, icon: 'i-lucide-newspaper' },
  { label: 'Pages', value: 'pages' as const, icon: 'i-lucide-file' },
  { label: 'Recettes', value: 'recipes' as const, icon: 'i-lucide-chef-hat' },
  { label: 'Externe', value: 'external' as const, icon: 'i-lucide-globe' },
]

const siteOrigin = computed(() => config.public.siteUrl as string)

function rowTitle(row: ListRow) {
  return row.title || row.name || row.slug
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

function selectInternal(kind: InternalKind, row: ListRow) {
  const href = rowHref(kind, row)
  selectedHref.value = href
  selectedTitle.value = rowTitle(row)
  selectedIcon.value = rowIcon(kind)
  selectedCover.value = row.coverBlobPathname ? mediaPublicUrl(row.coverBlobPathname) : null
  if (!props.hasTextSelection) {
    linkText.value = rowTitle(row)
  }
}

function selectExternal() {
  const raw = externalUrl.value.trim()
  if (!raw) {
    selectedHref.value = null
    return
  }
  const href = isExternalHref(raw) ? raw : `https://${raw}`
  selectedHref.value = href
  selectedTitle.value = externalLinkLabel(href)
  selectedIcon.value = 'i-lucide-globe'
  selectedCover.value = null
  if (!props.hasTextSelection && !linkText.value.trim()) {
    linkText.value = selectedTitle.value
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

const previewHref = computed(() => {
  if (mode.value === 'external') {
    return selectedHref.value
  }
  return selectedHref.value
})

const previewAbsolute = computed(() => {
  if (!previewHref.value) {
    return ''
  }
  if (isExternalHref(previewHref.value)) {
    return previewHref.value
  }
  return absolutePublicUrl(siteOrigin.value, previewHref.value)
})

const canApply = computed(() => Boolean(selectedHref.value?.trim()))

const editingExistingLink = computed(() => Boolean(props.initialHref?.trim()))

async function fetchInternalLists() {
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

function resetSelection() {
  selectedHref.value = null
  selectedTitle.value = null
  selectedCover.value = null
  selectedIcon.value = 'i-lucide-file-text'
}

function syncFromInitialHref() {
  resetSelection()
  search.value = ''
  linkText.value = ''
  externalUrl.value = ''

  const href = props.initialHref?.trim()
  if (!href) {
    return
  }

  if (isExternalHref(href)) {
    mode.value = 'external'
    externalUrl.value = href
    selectExternal()
    return
  }

  mode.value = 'articles'
  selectedHref.value = href
  selectedTitle.value = href
  selectedIcon.value = 'i-lucide-link'
}

watch(open, (isOpen) => {
  if (isOpen) {
    syncFromInitialHref()
    if (!articles.value.length && !pages.value.length && !recipes.value.length) {
      fetchInternalLists()
    }
  }
})

watch(mode, () => {
  if (mode.value !== 'external') {
    externalUrl.value = ''
  }
  if (!props.initialHref || mode.value === 'external') {
    resetSelection()
  }
})

watch(externalUrl, () => {
  if (mode.value === 'external') {
    selectExternal()
  }
})

function confirmApply() {
  if (!selectedHref.value?.trim()) {
    return
  }
  emit('apply', {
    href: selectedHref.value.trim(),
    title: props.hasTextSelection ? undefined : (linkText.value.trim() || selectedTitle.value || undefined),
  })
  open.value = false
}

function confirmRemove() {
  emit('remove')
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Insérer un lien"
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <UFieldGroup
          size="sm"
          orientation="horizontal"
          class="flex w-full flex-wrap gap-1"
        >
          <UButton
            v-for="item in modeItems"
            :key="item.value"
            :label="item.label"
            :icon="item.icon"
            :color="mode === item.value ? 'primary' : 'neutral'"
            :variant="mode === item.value ? 'soft' : 'ghost'"
            @click="mode = item.value"
          />
        </UFieldGroup>

        <template v-if="mode !== 'external'">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Rechercher par titre ou slug…"
            :disabled="loading"
          />

          <div
            v-if="loading"
            class="space-y-2"
          >
            <USkeleton
              v-for="index in 5"
              :key="index"
              class="h-12 w-full"
            />
          </div>

          <div
            v-else
            class="max-h-[min(16rem,40vh)] space-y-1 overflow-y-auto rounded-lg border border-default p-1"
          >
            <button
              v-for="row in currentRows"
              :key="`${mode}-${row.id}`"
              type="button"
              class="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              :class="selectedHref === rowHref(mode, row) ? 'bg-primary/10 ring-1 ring-primary/30' : ''"
              @click="selectInternal(mode, row)"
            >
              <div
                class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-elevated"
              >
                <img
                  v-if="row.coverBlobPathname"
                  :src="mediaPublicUrl(row.coverBlobPathname)"
                  alt=""
                  class="size-full object-cover"
                >
                <UIcon
                  v-else
                  :name="rowIcon(mode)"
                  class="size-5 text-muted"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-highlighted">
                  {{ rowTitle(row) }}
                </p>
                <p class="truncate text-xs text-muted">
                  {{ rowHref(mode, row) }}
                  <span
                    v-if="row.status && row.status !== 'published'"
                    class="ml-1 text-warning"
                  >({{ row.status }})</span>
                </p>
              </div>
              <UIcon
                v-if="selectedHref === rowHref(mode, row)"
                name="i-lucide-check"
                class="size-4 shrink-0 text-primary"
              />
            </button>

            <p
              v-if="!currentRows.length"
              class="px-2 py-6 text-center text-sm text-muted"
            >
              Aucun contenu trouvé.
            </p>
          </div>
        </template>

        <template v-else>
          <UFormField label="URL">
            <UInput
              v-model="externalUrl"
              icon="i-lucide-link"
              placeholder="https://exemple.com ou exemple.com"
              autofocus
            />
          </UFormField>
          <p class="text-xs text-muted">
            Les liens externes s’ouvriront dans un nouvel onglet sur le site public si configuré ainsi.
          </p>
        </template>

        <div
          v-if="!hasTextSelection"
          class="space-y-1"
        >
          <ContentFieldLabel label="Texte affiché" />
          <UInput
            v-model="linkText"
            placeholder="Libellé du lien dans l’article"
          />
        </div>

        <div
          v-if="previewHref"
          class="flex items-center gap-3 rounded-lg border border-default bg-elevated/40 p-3"
        >
          <div
            class="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-default"
          >
            <img
              v-if="selectedCover"
              :src="selectedCover"
              alt=""
              class="size-full object-cover"
            >
            <UIcon
              v-else
              :name="selectedIcon"
              class="size-5 text-primary"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-highlighted">
              {{ selectedTitle || previewHref }}
            </p>
            <p class="truncate text-xs text-muted">
              {{ previewAbsolute }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <UButton
          v-if="editingExistingLink"
          label="Retirer le lien"
          color="error"
          variant="ghost"
          icon="i-lucide-unlink"
          @click="confirmRemove"
        />
        <span v-else />

        <div class="flex gap-2">
          <UButton
            label="Annuler"
            color="neutral"
            variant="ghost"
            @click="open = false"
          />
          <UButton
            label="Appliquer"
            icon="i-lucide-check"
            :disabled="!canApply"
            @click="confirmApply"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
