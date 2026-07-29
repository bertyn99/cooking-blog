import { getApiErrorMessage } from '#shared/api-error'
import type {
  CreateGenerationRunBody,
  DiscoverArtifact,
  GenerationProgressResponse,
  GenerationReviewAction,
  GenerationRun,
  GenerationRunDetailResponse,
  GenerationRunListResponse,
  GenerationRunResponse,
  GenerationRunStatus,
} from '~/types/generation'

const TERMINAL_RUN_STATUSES = new Set<GenerationRunStatus>([
  'awaiting_review',
  'awaiting_selection',
  'approved',
  'rejected',
  'failed',
  'canceled',
])

export function isGenerationRunTerminal(status: GenerationRunStatus | undefined) {
  return status ? TERMINAL_RUN_STATUSES.has(status) : false
}

export function useGenerationComposer() {
  const { $api } = useNuxtApp()
  const toast = useToast()
  const router = useRouter()
  const submitting = ref(false)

  async function createRun(body: CreateGenerationRunBody) {
    submitting.value = true
    try {
      const response = await $api<GenerationRunResponse>('/api/admin/generation-runs', {
        method: 'POST',
        body,
      })
      toast.add({
        title: 'Génération démarrée',
        description: response.data.runKind === 'batch'
          ? 'Découverte des recettes / articles dans l’ebook…'
          : 'L’agent lit la source et recherche des mots-clés SEO.',
        color: 'success',
      })
      await router.push(`/generate/${response.data.id}`)
      return response.data
    }
    catch (error) {
      toast.add({
        title: 'Impossible de démarrer',
        description: getApiErrorMessage(error, 'Échec de la création du run'),
        color: 'error',
      })
      throw error
    }
    finally {
      submitting.value = false
    }
  }

  return {
    submitting,
    createRun,
  }
}

export function useGenerationReviewInbox() {
  const { $api } = useNuxtApp()

  const {
    data,
    pending,
    error,
    refresh,
  } = useAsyncData(
    'generation-review-inbox',
    () => $api<GenerationRunListResponse>('/api/admin/generation-runs', {
      query: { status: 'awaiting_review', excludeMine: '1' },
    }),
    { server: false },
  )

  const runs = computed(() => data.value?.data ?? [])
  const count = computed(() => data.value?.meta.count ?? 0)

  /** Group unit runs under their ebook parent when parentRunId is set. */
  const grouped = computed(() => {
    const orphans: GenerationRun[] = []
    const byParent = new Map<string, GenerationRun[]>()
    for (const run of runs.value) {
      if (run.parentRunId) {
        const list = byParent.get(run.parentRunId) ?? []
        list.push(run)
        byParent.set(run.parentRunId, list)
      }
      else {
        orphans.push(run)
      }
    }
    return { orphans, byParent }
  })

  return {
    runs,
    count,
    grouped,
    pending,
    error,
    refresh,
  }
}

export function useGenerationRun(runId: MaybeRefOrGetter<string>) {
  const { $api } = useNuxtApp()
  const toast = useToast()
  const { user } = useUserSession()
  const reviewing = ref(false)
  const selecting = ref(false)
  const reviewNote = ref('')

  const id = computed(() => toValue(runId))

  const {
    data: detail,
    pending: runPending,
    error: runError,
    refresh: refreshRun,
  } = useAsyncData(
    () => `generation-run-${id.value}`,
    () => $api<GenerationRunDetailResponse>(`/api/admin/generation-runs/${id.value}`),
    { watch: [id], server: false },
  )

  const run = computed(() => detail.value?.data ?? null)
  const children = computed(() => detail.value?.meta?.children ?? [])
  const discover = computed(() => (detail.value?.meta?.discover ?? null) as DiscoverArtifact | null)

  const {
    data: progress,
    refresh: refreshProgress,
  } = useAsyncData(
    () => `generation-progress-${id.value}`,
    () => $api<GenerationProgressResponse>(`/api/admin/generation-runs/${id.value}/progress`).then(r => r.data),
    { watch: [id], server: false },
  )

  const isBusy = computed(() => {
    const status = run.value?.status
    return status === 'queued' || status === 'running' || status === 'revising'
  })

  const canReview = computed(() => {
    if (run.value?.status !== 'awaiting_review') return false
    if (!user.value?.id) return false
    if (run.value.requestedByUserId != null && run.value.requestedByUserId === user.value.id) {
      return false
    }
    return true
  })

  const canApprove = canReview

  const canRequestChanges = computed(() => {
    if (!canReview.value) return false
    if (run.value?.targetType !== 'article') return false
    const round = run.value?.reviewRound ?? 1
    return round >= 1 && round <= 2
  })

  const canSelectCandidates = computed(() => {
    return run.value?.runKind === 'batch' && run.value.status === 'awaiting_selection'
  })

  const isSelfRequester = computed(() => {
    return run.value?.requestedByUserId != null
      && user.value?.id != null
      && run.value.requestedByUserId === user.value.id
  })

  const contentEditPath = computed(() => {
    if (run.value?.articleId) return `/articles/${run.value.articleId}`
    if (run.value?.recipeId) return `/recipes/${run.value.recipeId}`
    return null
  })

  async function refreshAll() {
    await Promise.all([refreshRun(), refreshProgress()])
  }

  const { pause: stopPolling, resume: startPolling } = useIntervalFn(
    () => { void refreshAll() },
    2000,
    { immediate: false },
  )

  watch(isBusy, (busy) => {
    if (busy) startPolling()
    else stopPolling()
  }, { immediate: true })

  onScopeDispose(() => {
    stopPolling()
  })

  async function submitReview(action: GenerationReviewAction, extras?: {
    reason?: string
  }) {
    reviewing.value = true
    try {
      await $api<GenerationRunResponse>(
        `/api/admin/generation-runs/${id.value}/review`,
        {
          method: 'POST',
          body: {
            action,
            reviewNote: reviewNote.value || undefined,
            reason: extras?.reason || (action === 'reject' ? reviewNote.value : undefined),
          },
        },
      )
      const titles: Record<GenerationReviewAction, string> = {
        approve: 'Run approuvé',
        reject: 'Run rejeté',
        request_changes: 'Révisions demandées',
      }
      toast.add({
        title: titles[action],
        color: action === 'reject' ? 'warning' : 'success',
      })
      await refreshAll()
    }
    catch (error) {
      toast.add({
        title: 'Action refusée',
        description: getApiErrorMessage(error, 'Échec de la relecture'),
        color: 'error',
      })
    }
    finally {
      reviewing.value = false
    }
  }

  async function approve() {
    await submitReview('approve')
  }

  async function reject() {
    if (!reviewNote.value.trim()) {
      toast.add({
        title: 'Motif requis',
        description: 'Indiquez pourquoi le run est rejeté.',
        color: 'warning',
      })
      return
    }
    await submitReview('reject', { reason: reviewNote.value })
  }

  async function requestChanges() {
    if (!reviewNote.value.trim()) {
      toast.add({
        title: 'Note requise',
        description: 'Décrivez les corrections attendues pour la révision IA.',
        color: 'warning',
      })
      return
    }
    await submitReview('request_changes')
  }

  async function selectCandidates(candidateIds: string[]) {
    selecting.value = true
    try {
      await $api(`/api/admin/generation-runs/${id.value}/select-candidates`, {
        method: 'POST',
        body: { candidateIds },
      })
      toast.add({
        title: 'Générations lancées',
        description: `${candidateIds.length} run(s) enfant créé(s) à partir de l’ebook.`,
        color: 'success',
      })
      await refreshAll()
    }
    catch (error) {
      toast.add({
        title: 'Sélection refusée',
        description: getApiErrorMessage(error, 'Échec de la sélection'),
        color: 'error',
      })
    }
    finally {
      selecting.value = false
    }
  }

  return {
    run,
    children,
    discover,
    progress,
    runPending,
    runError,
    isBusy,
    canApprove,
    canReview,
    canRequestChanges,
    canSelectCandidates,
    isSelfRequester,
    contentEditPath,
    reviewNote,
    reviewing,
    selecting,
    approving: reviewing,
    refreshAll,
    approve,
    reject,
    requestChanges,
    selectCandidates,
  }
}
