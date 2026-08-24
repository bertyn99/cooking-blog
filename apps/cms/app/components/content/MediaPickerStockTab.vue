<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { readApiErrorMessage } from '~/utils/media'
import type { StockOrientation, StockSearchItem, StockSearchResponse } from '~/types/media-picker'

defineProps<{
  busy?: boolean
}>()

const emit = defineEmits<{
  select: [item: StockSearchItem]
  clearStockSelection: []
}>()

const { $api } = useNuxtApp()
const toast = useToast()

const search = ref('')
const orientation = ref<StockOrientation | undefined>()
const filtersOpen = ref(false)
const loading = ref(false)
const items = ref<StockSearchItem[]>([])
const selectedId = ref<string | null>(null)
const hasSearched = ref(false)
const page = ref(1)
const hasMore = ref(false)

let searchRequestId = 0
let abortController: AbortController | null = null
let suppressEmptySearchClear = false
let skipSearchWatch = false

const orientationOptions: { label: string, value: StockOrientation | undefined }[] = [
  { label: 'Tous', value: undefined },
  { label: 'Paysage', value: 'landscape' },
  { label: 'Portrait', value: 'portrait' },
  { label: 'Carré', value: 'square' },
]

const selectedItem = computed(() =>
  items.value.find(item => item.id === selectedId.value) ?? null,
)

const attributionLine = computed(() => {
  if (!selectedItem.value) return null
  return `Photo · ${selectedItem.value.photographer} · Pexels`
})

async function runSearch(reset = true) {
  const query = search.value.trim()
  if (!query) {
    items.value = []
    hasSearched.value = false
    selectedId.value = null
    if (!suppressEmptySearchClear) {
      emit('clearStockSelection')
    }
    return
  }

  if (reset) {
    page.value = 1
    items.value = []
  }

  abortController?.abort()
  abortController = new AbortController()
  const requestId = ++searchRequestId
  loading.value = true
  hasSearched.value = true

  try {
    const res = await $api<StockSearchResponse>('/api/media/stock/search', {
      query: {
        q: query,
        page: page.value,
        per_page: 20,
        ...(orientation.value ? { orientation: orientation.value } : {}),
        locale: 'fr-FR',
      },
      signal: abortController.signal,
    })

    if (requestId !== searchRequestId) return

    items.value = reset ? res.items : [...items.value, ...res.items]
    hasMore.value = res.hasMore
  }
  catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    if (requestId !== searchRequestId) return
    toast.add({
      title: 'Recherche impossible',
      description: readApiErrorMessage(error, 'Vérifiez votre connexion et réessayez.'),
      color: 'error',
    })
    items.value = []
  }
  finally {
    if (requestId === searchRequestId) {
      loading.value = false
    }
  }
}

const debouncedSearch = useDebounceFn(() => runSearch(true), 350)

watch(search, () => {
  if (skipSearchWatch) return
  debouncedSearch()
})

watch(orientation, () => {
  if (search.value.trim()) runSearch(true)
})

function selectItem(item: StockSearchItem) {
  selectedId.value = item.id
  emit('select', item)
}

function reset() {
  suppressEmptySearchClear = true
  skipSearchWatch = true
  abortController?.abort()
  orientation.value = undefined
  filtersOpen.value = false
  items.value = []
  selectedId.value = null
  hasSearched.value = false
  search.value = ''
  nextTick(() => {
    suppressEmptySearchClear = false
    skipSearchWatch = false
  })
}

defineExpose({
  reset,
  getSelected: () => selectedItem.value,
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Ex. tarte aux pommes, planche de légumes…"
        class="min-w-[12rem] flex-1"
        :loading="loading"
      />
      <UButton
        label="Filtres"
        icon="i-lucide-sliders-horizontal"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="filtersOpen = !filtersOpen"
      />
    </div>

    <div
      v-if="filtersOpen"
      class="flex flex-wrap gap-2 overflow-hidden transition-all duration-180"
    >
      <UButton
        v-for="opt in orientationOptions"
        :key="opt.label"
        :label="opt.label"
        size="xs"
        :color="orientation === opt.value ? 'primary' : 'neutral'"
        :variant="orientation === opt.value ? 'solid' : 'outline'"
        @click="orientation = opt.value"
      />
    </div>

    <div
      v-if="!hasSearched && !loading"
      class="flex min-h-[12rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-default px-4 py-8 text-center"
    >
      <UIcon name="i-lucide-image" class="size-8 text-muted" />
      <p class="text-sm text-muted">
        Recherchez une photo libre de droits
      </p>
    </div>

    <div
      v-else-if="loading && !items.length"
      class="grid grid-cols-3 gap-2 sm:grid-cols-4"
    >
      <USkeleton v-for="index in 8" :key="index" class="aspect-[4/3] w-full rounded-lg" />
    </div>

    <div
      v-else-if="items.length"
      class="max-h-[min(24rem,50vh)] overflow-y-auto rounded-lg border border-default bg-elevated/20 p-2"
    >
      <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="group relative overflow-hidden rounded-lg border-2 text-left transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          :class="[
            selectedId === item.id
              ? 'border-primary ring-2 ring-primary/30'
              : 'border-transparent hover:border-default',
            busy ? 'pointer-events-none opacity-70 animate-pulse' : '',
          ]"
          @click="selectItem(item)"
        >
          <img
            :src="item.previewUrl"
            :alt="item.alt"
            class="aspect-[4/3] w-full object-cover"
            loading="lazy"
          >
          <div
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1.5 pt-5 opacity-0 transition-opacity duration-120 group-hover:opacity-100 group-focus-visible:opacity-100"
            :class="selectedId === item.id ? '!opacity-100' : ''"
          >
            <p class="truncate text-[10px] font-medium text-white">
              {{ item.photographer }}
            </p>
          </div>
          <div
            v-if="selectedId === item.id"
            class="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-white"
          >
            <UIcon name="i-lucide-check" class="size-3.5" />
          </div>
        </button>
      </div>
      <div v-if="hasMore" class="flex justify-center py-2">
        <UButton
          label="Charger plus"
          variant="ghost"
          size="sm"
          :loading="loading"
          @click="page++; runSearch(false)"
        />
      </div>
    </div>

    <UAlert
      v-else-if="hasSearched && !loading"
      color="neutral"
      variant="subtle"
      icon="i-lucide-search-x"
      title="Aucun résultat"
      description="Essayez d’autres mots-clés ou modifiez les filtres."
    />

    <p
      v-if="attributionLine"
      class="text-xs text-muted"
    >
      {{ attributionLine }}
    </p>
  </div>
</template>
