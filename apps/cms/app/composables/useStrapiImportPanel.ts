import type { Ref } from 'vue'
import type { CheckboxGroupItem } from '@nuxt/ui'
import { FetchError } from 'ofetch'
import type {
  StrapiImportConfigResponse,
  StrapiImportProgress,
  StrapiImportStep,
} from '#shared/strapi-import'
import { formatStepCoverageHint, isImportResultFullyUnchanged } from '#shared/strapi-import'

export function formatStepCoverageHintForItem(step: StrapiImportStep, config: StrapiImportConfigResponse | null) {
  const coverage = config?.stepCoverage?.[step]
  if (!coverage) return null
  return formatStepCoverageHint(coverage)
}

export const STRAPI_IMPORT_STEP_ITEMS: CheckboxGroupItem[] = [
  { value: 'category-articles', label: 'Catégories blog', description: 'Taxonomie des articles' },
  { value: 'categories', label: 'Catégories recettes', description: 'Taxonomie des recettes + images' },
  { value: 'articles', label: 'Articles', description: 'Contenu blog + couvertures' },
  { value: 'recipes', label: 'Recettes', description: 'Ingrédients, nutrition, avis, médias' },
  { value: 'pages', label: 'Pages', description: 'Pages CMS (zones → markdown)' },
]

const DEFAULT_STEPS = STRAPI_IMPORT_STEP_ITEMS.map(item => item.value as StrapiImportStep)

export interface UseStrapiImportPanelOptions {
  selectedSteps?: Ref<StrapiImportStep[]>
  dryRun?: Ref<boolean>
}

export function formatImportError(error: unknown): string {
  if (error instanceof FetchError) {
    const data = error.data as { error?: { message?: string }, message?: string } | undefined
    return data?.error?.message ?? data?.message ?? error.statusMessage ?? error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Échec de l’import'
}

export function useStrapiImportPanel(options: UseStrapiImportPanelOptions = {}) {
  const { $api } = useNuxtApp()
  const toast = useToast()

  const selectedSteps = options.selectedSteps ?? ref<StrapiImportStep[]>([...DEFAULT_STEPS])
  const dryRun = options.dryRun ?? ref(true)
  const running = ref(false)
  const confirmOpen = ref(false)
  const lastNotifiedStatus = ref<StrapiImportProgress['status']>('idle')

  const { data: config, refresh } = useAsyncData('strapi-import-config', () =>
    $api<StrapiImportConfigResponse>('/api/admin/strapi-import'),
  )

  const importStatus = computed(() => config.value?.status)
  /** HTTP request in flight or server-reported import still running (launch button only). */
  const isLaunching = computed(
    () => running.value || importStatus.value?.status === 'running',
  )

  const { pause: stopPolling, resume: startPolling } = useIntervalFn(
    () => { void refresh() },
    2000,
    { immediate: false },
  )

  watch(isLaunching, (busy) => {
    if (busy) startPolling()
    else stopPolling()
  }, { immediate: true })

  watch(importStatus, (status) => {
    if (!status) return
    if (status.status === lastNotifiedStatus.value) return
    if (status.status === 'completed') {
      const fullySynced = status.result && isImportResultFullyUnchanged(status.result)
      toast.add({
        title: status.dryRun
          ? (fullySynced ? 'Simulation : déjà à jour' : 'Simulation terminée')
          : (fullySynced ? 'Import : rien à modifier' : 'Import terminé'),
        description: fullySynced
          ? 'Le contenu sélectionné correspond déjà à Strapi.'
          : status.result?.messages.at(-1),
        color: fullySynced ? 'neutral' : 'success',
      })
      lastNotifiedStatus.value = 'completed'
      return
    }
    if (status.status === 'failed') {
      toast.add({
        title: 'Import échoué',
        description: status.error ?? 'Erreur inconnue',
        color: 'error',
      })
      lastNotifiedStatus.value = 'failed'
    }
  })

  onBeforeUnmount(stopPolling)

  const reachabilityBadge = computed(() => {
    if (config.value?.strapiReachable === true) {
      return { label: 'Strapi accessible', color: 'success' as const }
    }
    if (config.value?.strapiReachable === false) {
      return { label: 'Strapi injoignable', color: 'error' as const }
    }
    return { label: 'État inconnu', color: 'neutral' as const }
  })

  const statusBadgeColor = computed(() => {
    const value = importStatus.value?.status
    if (value === 'completed') return 'success'
    if (value === 'failed') return 'error'
    if (value === 'running') return 'warning'
    return 'neutral'
  })

  async function refreshConnection() {
    await $api<StrapiImportConfigResponse>('/api/admin/strapi-import', {
      query: { testConnection: 'true' },
    })
    await refresh()
  }

  async function resetImportState() {
    await $api('/api/admin/strapi-import/reset', { method: 'POST' })
    lastNotifiedStatus.value = 'idle'
    await refresh()
    toast.add({ title: 'État d’import réinitialisé', color: 'neutral' })
  }

  async function executeImport() {
    const steps = selectedSteps.value.length > 0
      ? selectedSteps.value
      : [...DEFAULT_STEPS]

    if (!steps.length) {
      toast.add({ title: 'Sélectionnez au moins une étape', color: 'warning' })
      return
    }

    running.value = true

    try {
      const response = await $api<{
        accepted: boolean
        completed?: boolean
        message: string
        result?: StrapiImportProgress['result']
      }>('/api/admin/strapi-import/run', {
        method: 'POST',
        body: {
          dryRun: dryRun.value,
          steps,
        },
      })

      await refresh()

      if (!response.completed) {
        lastNotifiedStatus.value = 'running'
        toast.add({
          title: dryRun.value ? 'Simulation lancée' : 'Import lancé',
          description: response.message,
          color: 'info',
        })
      }
    }
    catch (error) {
      lastNotifiedStatus.value = importStatus.value?.status ?? 'idle'
      toast.add({
        title: 'Impossible de démarrer l’import',
        description: formatImportError(error),
        color: 'error',
      })
      await refresh()
    }
    finally {
      running.value = false
      confirmOpen.value = false
    }
  }

  function requestImport() {
    const steps = selectedSteps.value.length > 0
      ? selectedSteps.value
      : [...DEFAULT_STEPS]

    if (!steps.length) {
      toast.add({ title: 'Sélectionnez au moins une étape', color: 'warning' })
      return
    }
    if (dryRun.value) {
      void executeImport()
      return
    }
    confirmOpen.value = true
  }

  return {
    config,
    refresh,
    refreshConnection,
    resetImportState,
    selectedSteps,
    dryRun,
    running,
    confirmOpen,
    importStatus,
    isLaunching,
    reachabilityBadge,
    statusBadgeColor,
    requestImport,
    executeImport,
  }
}
