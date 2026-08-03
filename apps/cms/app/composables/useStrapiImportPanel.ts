import type { Ref } from 'vue'
import type { CheckboxGroupItem } from '@nuxt/ui'
import type {
  StrapiImportConfigResponse,
  StrapiImportContinuation,
  StrapiImportProgress,
  StrapiImportStep,
  StrapiImportTestTarget,
} from '#shared/strapi-import'
import { getApiErrorMessage } from '#shared/api-error'
import {
  formatStepCoverageHint,
  isImportResultFullyUnchanged,
  STRAPI_IMPORT_TEST_TARGET_STEP,
} from '#shared/strapi-import'

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
  return getApiErrorMessage(error, 'Échec de l’import')
}

type StrapiImportRunResponse = {
  accepted: boolean
  completed?: boolean
  message: string
  continuation?: StrapiImportContinuation
  result?: StrapiImportProgress['result']
  status?: StrapiImportProgress
}

function mergeImportRunIntoConfig(
  config: StrapiImportConfigResponse | null | undefined,
  response: StrapiImportRunResponse,
): StrapiImportConfigResponse | null | undefined {
  if (!config) return config

  if (response.status) {
    return { ...config, status: response.status }
  }

  if (!response.result) return config

  const progress: StrapiImportProgress = {
    status: response.completed ? 'completed' : 'running',
    dryRun: response.result.dryRun,
    messages: response.result.messages.slice(-200),
    finishedAt: response.completed ? response.result.finishedAt : undefined,
    result: response.completed ? response.result : undefined,
  }

  return { ...config, status: progress }
}

export function useStrapiImportPanel(options: UseStrapiImportPanelOptions = {}) {
  const { $api } = useNuxtApp()
  const toast = useToast()
  const { loggedIn } = useUserSession()

  const selectedSteps = options.selectedSteps ?? ref<StrapiImportStep[]>([...DEFAULT_STEPS])
  const dryRun = options.dryRun ?? ref(true)
  const running = ref(false)
  const confirmOpen = ref(false)
  const lastNotifiedStatus = ref<StrapiImportProgress['status']>('idle')

  const {
    data: config,
    refresh,
    error: configError,
  } = useAsyncData(
    'strapi-import-config',
    () => $api<StrapiImportConfigResponse>('/api/admin/strapi-import'),
    { server: false },
  )

  watch(loggedIn, (value) => {
    if (value) void refresh()
  }, { immediate: true })

  const importStatus = computed(() => config.value?.status)
  const isSubmitting = computed(() => running.value)
  const isRemoteImportRunning = computed(() => importStatus.value?.status === 'running')
  /** Spinner on launch while POST runs or server reports import in progress. */
  const isLaunchBusy = computed(() => isSubmitting.value || isRemoteImportRunning.value)

  const { pause: stopPolling, resume: startPolling } = useIntervalFn(
    () => { void refresh() },
    2000,
    { immediate: false },
  )

  // Poll while POST is in flight or server reports running — journal lives in KV updated during run.
  watch(isLaunchBusy, (busy) => {
    if (busy) startPolling()
    else stopPolling()
  }, { immediate: true })

  watch(importStatus, (status) => {
    if (!status) return
    if (status.status === lastNotifiedStatus.value) return
    if (status.status === 'completed') {
      const fullySynced = status.result && isImportResultFullyUnchanged(status.result)
      if (!status.dryRun) {
        void refreshNuxtData(['categories-recipes-list', 'categories-articles-list'])
      }
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

  const activeContinuation = ref(false)
  const abortControllerRef = ref<AbortController | null>(null)

  function onPageHideGlobal() {
    abortControllerRef.value?.abort()
  }

  if (import.meta.client) {
    window.addEventListener('pagehide', onPageHideGlobal)
  }

  onBeforeUnmount(() => {
    stopPolling()
    if (import.meta.client) {
      window.removeEventListener('pagehide', onPageHideGlobal)
    }
    if (activeContinuation.value) {
      void $api('/api/admin/strapi-import/reset', { method: 'POST' }).catch(() => {})
    }
  })

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
    activeContinuation.value = false
    await refresh()
    toast.add({ title: 'État d’import réinitialisé', color: 'neutral' })
  }

  async function executeImport(overrides?: {
    steps?: StrapiImportStep[]
    dryRun?: boolean
    slugFilter?: { slug: string, locale?: string }
    omitDependencies?: boolean
  }) {
    const steps = overrides?.steps ?? (selectedSteps.value.length > 0
      ? selectedSteps.value
      : [...DEFAULT_STEPS])

    if (!steps.length) {
      toast.add({ title: 'Sélectionnez au moins une étape', color: 'warning' })
      return
    }

    const runDryRun = overrides?.dryRun ?? dryRun.value
    running.value = true
    lastNotifiedStatus.value = 'running'
    activeContinuation.value = false
    const abortController = typeof AbortController !== 'undefined' ? new AbortController() : null
    abortControllerRef.value = abortController
    void refresh()

    try {
      let continuation: StrapiImportContinuation | undefined

      do {
        const response = await $api<StrapiImportRunResponse>('/api/admin/strapi-import/run', {
          method: 'POST',
          body: continuation
            ? { continuation }
            : {
                dryRun: runDryRun,
                steps,
                slugFilter: overrides?.slugFilter,
                omitDependencies: overrides?.omitDependencies,
              },
          signal: abortController?.signal,
        })

        if (config.value) {
          config.value = mergeImportRunIntoConfig(config.value, response) ?? config.value
        }

        continuation = response.completed === false ? response.continuation : undefined
        activeContinuation.value = Boolean(continuation)
        await refresh()
      } while (continuation)
    }
    catch (error) {
      const aborted = Boolean(abortController?.signal.aborted)
        || (error instanceof DOMException && error.name === 'AbortError')
        || (error instanceof Error && error.name === 'AbortError')

      await refresh()
      const remoteStatus = importStatus.value?.status

      if (aborted) {
        if (remoteStatus === 'running') {
          try {
            await $api('/api/admin/strapi-import/reset', { method: 'POST' })
          }
          catch {
            // Best-effort unlock so the next import can start.
          }
        }
        activeContinuation.value = false
        lastNotifiedStatus.value = 'idle'
        await refresh()
        toast.add({
          title: 'Import interrompu',
          description: 'L’onglet a été fermé ou la requête annulée. Relancez l’import.',
          color: 'warning',
        })
      }
      else if (activeContinuation.value && remoteStatus === 'running') {
        try {
          await $api('/api/admin/strapi-import/reset', { method: 'POST' })
        }
        catch {
          // Best-effort unlock so the next import can start.
        }
        activeContinuation.value = false
        lastNotifiedStatus.value = 'idle'
        await refresh()
        toast.add({
          title: 'Import interrompu — état réinitialisé',
          description: formatImportError(error),
          color: 'warning',
        })
      }
      else if (remoteStatus === 'failed') {
        lastNotifiedStatus.value = 'failed'
        toast.add({
          title: 'Import échoué',
          description: importStatus.value?.error ?? formatImportError(error),
          color: 'error',
        })
      }
      else {
        lastNotifiedStatus.value = remoteStatus ?? 'idle'
        toast.add({
          title: activeContinuation.value
            ? 'Reprise d’import impossible'
            : 'Impossible de démarrer l’import',
          description: formatImportError(error),
          color: 'error',
        })
      }
    }
    finally {
      abortControllerRef.value = null
      activeContinuation.value = false
      running.value = false
      confirmOpen.value = false
    }
  }

  function requestTargetedImport(
    target: StrapiImportTestTarget,
    slug: string,
    locale?: string,
    options?: { dryRun?: boolean },
  ) {
    const trimmed = slug.trim()
    if (!trimmed) {
      toast.add({ title: 'Indiquez un slug Strapi', color: 'warning' })
      return
    }
    const step = STRAPI_IMPORT_TEST_TARGET_STEP[target]
    const runDryRun = options?.dryRun ?? dryRun.value
    if (runDryRun) {
      void executeImport({
        steps: [step],
        dryRun: true,
        slugFilter: { slug: trimmed, locale: locale?.trim() || undefined },
        omitDependencies: true,
      })
      return
    }
    confirmOpen.value = true
    pendingTargetedImport.value = {
      steps: [step],
      slugFilter: { slug: trimmed, locale: locale?.trim() || undefined },
    }
  }

  const pendingTargetedImport = ref<{
    steps: StrapiImportStep[]
    slugFilter: { slug: string, locale?: string }
  } | null>(null)

  async function executeImportConfirmed() {
    if (pendingTargetedImport.value) {
      const pending = pendingTargetedImport.value
      pendingTargetedImport.value = null
      await executeImport({
        steps: pending.steps,
        dryRun: false,
        slugFilter: pending.slugFilter,
        omitDependencies: true,
      })
      return
    }
    await executeImport()
  }

  function requestImport() {
    pendingTargetedImport.value = null
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
    configError,
    refresh,
    refreshConnection,
    resetImportState,
    selectedSteps,
    dryRun,
    running,
    confirmOpen,
    importStatus,
    isSubmitting,
    isRemoteImportRunning,
    isLaunchBusy,
    reachabilityBadge,
    statusBadgeColor,
    requestImport,
    requestTargetedImport,
    executeImport: executeImportConfirmed,
    executeImportFull: executeImport,
  }
}
