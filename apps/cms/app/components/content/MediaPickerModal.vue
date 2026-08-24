<script setup lang="ts">
import { readApiErrorMessage } from '~/utils/media'
import type { MediaPickerTab, StockSearchItem } from '~/types/media-picker'

const open = defineModel<boolean>('open', { required: true })

const props = withDefaults(defineProps<{
  title?: string
  selectedPathname?: string | null
  selectOnUpload?: boolean
  deferUpload?: boolean
}>(), {
  title: 'Bibliothèque médias',
  selectedPathname: null,
  selectOnUpload: true,
  deferUpload: false,
})

const emit = defineEmits<{
  select: [pathname: string]
  selectLocal: [payload: { previewUrl: string, file: File }]
}>()

const { $api } = useNuxtApp()
const toast = useToast()

const activeTab = ref<MediaPickerTab>('library')
const capabilities = ref({ stock: false, aiGenerate: false })
const capabilitiesLoaded = ref(false)

const busy = ref(false)
const busyLabel = ref('')
const footerStatus = ref('Sélectionnez une image dans la grille')

const pendingPathname = ref<string | null>(null)
const pendingLocal = ref<{ previewUrl: string, file: File, name: string } | null>(null)
const pendingStockItem = ref<StockSearchItem | null>(null)
const stockAttribution = ref<string | null>(null)

const libraryRef = ref<{
  refreshGallery: () => Promise<void>
  resetSelection: () => void
} | null>(null)

const stockRef = ref<{
  reset: () => void
  getSelected: () => import('~/types/media-picker').StockSearchItem | null
} | null>(null)

const aiRef = ref<{
  reset: () => void
  abort: () => void
  isGenerating: () => boolean
} | null>(null)

const tabItems = computed(() => {
  const items: { label: string, value: MediaPickerTab, disabled?: boolean }[] = [
    { label: 'Bibliothèque', value: 'library' },
  ]
  if (capabilities.value.stock) {
    items.push({ label: 'Stock', value: 'stock' })
  }
  if (capabilities.value.aiGenerate) {
    items.push({ label: 'IA', value: 'ai' })
  }
  return items
})

const canConfirm = computed(() => {
  if (pendingPathname.value || pendingLocal.value) {
    return true
  }
  return activeTab.value === 'stock' && Boolean(pendingStockItem.value)
})
const confirmEnabled = computed(() => canConfirm.value && !busy.value)

const reducedMotion = usePreferredReducedMotion()

async function loadCapabilities() {
  try {
    capabilities.value = await $api('/api/media/picker-capabilities')
  }
  catch {
    capabilities.value = { stock: false, aiGenerate: false }
  }
  finally {
    capabilitiesLoaded.value = true
  }
}

function revokePendingLocal() {
  if (pendingLocal.value) {
    URL.revokeObjectURL(pendingLocal.value.previewUrl)
    pendingLocal.value = null
  }
}

function clearStockSelection() {
  pendingStockItem.value = null
  stockAttribution.value = null
  updateFooterFromSelection()
}

function clearPending() {
  pendingPathname.value = null
  pendingStockItem.value = null
  revokePendingLocal()
  stockAttribution.value = null
  footerStatus.value = 'Sélectionnez une image'
}

function updateFooterFromSelection() {
  if (busy.value) {
    return
  }
  if (pendingLocal.value) {
    footerStatus.value = `Sélection : ${pendingLocal.value.name} (brouillon)`
    return
  }
  if (pendingPathname.value) {
    const name = pendingPathname.value.split('/').pop() ?? pendingPathname.value
    footerStatus.value = stockAttribution.value
      ? `Sélection : ${name} — ${stockAttribution.value}`
      : `Sélection : ${name}`
    return
  }
  footerStatus.value = activeTab.value === 'stock'
    ? 'Recherchez une photo libre de droits'
    : activeTab.value === 'ai'
      ? 'Décrivez l’image à générer'
      : 'Sélectionnez une image dans la grille'
}

watch([pendingPathname, pendingLocal, stockAttribution, activeTab, busy], updateFooterFromSelection)

function isBusyOperation() {
  return busy.value || aiRef.value?.isGenerating()
}

async function trySwitchTab(next: MediaPickerTab) {
  if (next === activeTab.value) {
    return
  }
  if (isBusyOperation()) {
    toast.add({
      title: 'Opération en cours',
      description: 'Attendez la fin de l’import ou de la génération.',
      color: 'warning',
    })
    return
  }
  activeTab.value = next
  if (next !== 'stock') {
    pendingStockItem.value = null
    if (!pendingPathname.value && !pendingLocal.value) {
      stockAttribution.value = null
    }
  }
}

function onLibrarySelect(pathname: string) {
  pendingPathname.value = pathname
  pendingLocal.value = null
  pendingStockItem.value = null
  stockAttribution.value = null
}

function onLibrarySelectLocal(payload: { previewUrl: string, file: File, name: string }) {
  pendingLocal.value = payload
  pendingPathname.value = null
  pendingStockItem.value = null
  stockAttribution.value = null
}

function onStockSelect(item: StockSearchItem) {
  pendingStockItem.value = item
  pendingPathname.value = null
  pendingLocal.value = null
  stockAttribution.value = `Photo · ${item.photographer} · Pexels`
}

async function importStockSelection(item: StockSearchItem) {
  busy.value = true
  busyLabel.value = 'Import…'
  footerStatus.value = 'Import dans la médiathèque…'
  try {
    const result = await $api<{ pathname: string, duplicate?: boolean }>('/api/media/stock/import', {
      method: 'POST',
      body: {
        provider: 'pexels',
        id: item.id,
        preferredSize: 'large',
      },
    })
    pendingPathname.value = result.pathname
    pendingStockItem.value = null
    if (result.duplicate) {
      footerStatus.value = 'Déjà dans la bibliothèque'
    }
    return result.pathname
  }
  catch (error: unknown) {
    toast.add({
      title: 'Échec de l’import',
      description: readApiErrorMessage(error, 'Réessayez ou choisissez une autre image.'),
      color: 'error',
    })
    throw error
  }
  finally {
    busy.value = false
    busyLabel.value = ''
    updateFooterFromSelection()
  }
}

async function onAiGenerated(pathname: string) {
  pendingPathname.value = pathname
  pendingLocal.value = null
  pendingStockItem.value = null
  stockAttribution.value = null
  await libraryRef.value?.refreshGallery()
}

watch(open, async (isOpen) => {
  if (isOpen) {
    activeTab.value = 'library'
    clearPending()
    pendingPathname.value = props.selectedPathname
    await loadCapabilities()
    await libraryRef.value?.refreshGallery()
  }
  else {
    if (aiRef.value?.isGenerating()) {
      aiRef.value.abort()
    }
    revokePendingLocal()
    stockRef.value?.reset()
    aiRef.value?.reset()
  }
})

watch(() => props.selectedPathname, (value) => {
  if (open.value && value) {
    pendingPathname.value = value
  }
})

async function confirmSelection() {
  if (busy.value) {
    return
  }

  if (activeTab.value === 'stock' && !pendingPathname.value) {
    const selected = pendingStockItem.value ?? stockRef.value?.getSelected()
    if (!selected) {
      return
    }
    try {
      await importStockSelection(selected)
    }
    catch {
      return
    }
  }

  if (pendingLocal.value) {
    emit('selectLocal', {
      previewUrl: pendingLocal.value.previewUrl,
      file: pendingLocal.value.file,
    })
    open.value = false
    pendingLocal.value = null
    return
  }

  if (!pendingPathname.value) {
    return
  }

  emit('select', pendingPathname.value)
  open.value = false
}

function onCancel() {
  if (isBusyOperation()) {
    const confirmed = window.confirm('Une opération est en cours. L’annuler et fermer ?')
    if (!confirmed) {
      return
    }
    aiRef.value?.abort()
    busy.value = false
  }
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <div
          v-if="capabilitiesLoaded && tabItems.length > 1"
          class="flex gap-1 rounded-lg bg-elevated/40 p-1"
          role="tablist"
          aria-label="Source d’image"
        >
          <button
            v-for="tab in tabItems"
            :key="tab.value"
            type="button"
            role="tab"
            class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150"
            :class="activeTab === tab.value
              ? 'bg-default text-highlighted shadow-sm'
              : 'text-muted hover:text-highlighted'"
            :aria-selected="activeTab === tab.value"
            @click="trySwitchTab(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div
          class="transition-opacity duration-150"
          :class="reducedMotion === 'reduce' ? '' : 'motion-safe:transition-opacity'"
          role="tabpanel"
        >
          <ContentMediaPickerLibraryTab
            v-show="activeTab === 'library'"
            ref="libraryRef"
            :defer-upload="deferUpload"
            :select-on-upload="selectOnUpload"
            :selected-pathname="pendingPathname"
            :busy="busy"
            @select="onLibrarySelect"
            @select-local="onLibrarySelectLocal"
            @busy="(value) => { busy = value; busyLabel = value ? 'Compression…' : '' }"
            @confirm="confirmSelection"
          />

          <ContentMediaPickerStockTab
            v-if="capabilities.stock"
            v-show="activeTab === 'stock'"
            ref="stockRef"
            :busy="busy"
            @select="onStockSelect"
            @clear-stock-selection="clearStockSelection"
          />

          <ContentMediaPickerAiTab
            v-if="capabilities.aiGenerate"
            v-show="activeTab === 'ai'"
            ref="aiRef"
            @generated="onAiGenerated"
            @busy="(value, label) => { busy = value; busyLabel = label ?? '' }"
          />
        </div>

        <p
          class="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          {{ busy ? busyLabel : footerStatus }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <p
          class="text-xs text-muted transition-opacity duration-120"
          :class="confirmEnabled && !reducedMotion ? 'motion-safe:opacity-100' : ''"
        >
          <template v-if="busy">
            {{ busyLabel || 'Traitement…' }}
          </template>
          <template v-else>
            {{ footerStatus }}
          </template>
        </p>
        <div class="flex gap-2">
          <UButton
            label="Annuler"
            color="neutral"
            variant="ghost"
            @click="onCancel"
          />
          <UButton
            label="Utiliser cette image"
            icon="i-lucide-check"
            :disabled="!confirmEnabled"
            :loading="busy"
            class="transition-all duration-120"
            :class="confirmEnabled && !reducedMotion ? 'motion-safe:scale-100' : ''"
            @click="confirmSelection"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
