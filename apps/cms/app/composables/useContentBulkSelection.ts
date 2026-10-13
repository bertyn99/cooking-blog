import type { DropdownMenuItem } from '@nuxt/ui'
import type { RowSelectionState } from '@tanstack/table-core'
import { getApiErrorMessage } from '#shared/api-error'
import {
  BULK_IDS_MAX,
  bulkDeleteDescription,
  bulkSuccessTitle,
  type BulkMutationResult,
  type BulkNoun,
  type BulkPageAction,
} from '#shared/content-bulk'

export function useContentBulkSelection(options: {
  endpoint: MaybeRefOrGetter<string>
  noun: MaybeRefOrGetter<BulkNoun>
  refresh: () => Promise<unknown>
  visibleIds?: MaybeRefOrGetter<number[]>
  max?: number
}) {
  const { $api } = useNuxtApp()
  const toast = useToast()
  const { user } = useUserSession()

  const rowSelection = ref<RowSelectionState>({})
  const bulkLoading = ref(false)
  const deleteConfirmOpen = ref(false)
  const max = options.max ?? BULK_IDS_MAX

  const selectedIds = computed(() =>
    Object.entries(rowSelection.value)
      .filter(([, selected]) => selected)
      .map(([id]) => Number(id))
      .filter(id => Number.isInteger(id) && id > 0),
  )
  const selectedCount = computed(() => selectedIds.value.length)
  const canBulkChangeStatus = computed(() => user.value?.role === 'admin')
  const noun = computed(() => toValue(options.noun))
  const deleteConfirmDescription = computed(() =>
    bulkDeleteDescription(noun.value, selectedCount.value),
  )
  const hiddenSelectedCount = computed(() => {
    if (options.visibleIds == null) return 0
    const visible = new Set(toValue(options.visibleIds))
    return selectedIds.value.filter(id => !visible.has(id)).length
  })
  const selectedHint = computed(() => {
    const hidden = hiddenSelectedCount.value
    if (!hidden) return ''
    return `${hidden} hors de cette page`
  })

  const bulkStatusItems = computed<DropdownMenuItem[]>(() => [
    {
      label: 'Publier',
      icon: 'i-lucide-globe',
      onSelect: () => {
        void runBulkAction('publish')
      },
    },
    {
      label: 'Repasser en brouillon',
      icon: 'i-lucide-file-pen',
      onSelect: () => {
        void runBulkAction('unpublish')
      },
    },
  ])

  function clearSelection() {
    rowSelection.value = {}
  }

  function trySelect(id: string, selected: boolean): boolean {
    if (!selected) {
      if (!rowSelection.value[id]) return true
      rowSelection.value = Object.fromEntries(
        Object.entries(rowSelection.value).filter(([key]) => key !== id),
      )
      return true
    }
    if (rowSelection.value[id]) return true
    if (selectedCount.value >= max) {
      toast.add({
        title: `Maximum ${max} éléments sélectionnés`,
        color: 'warning',
      })
      return false
    }
    rowSelection.value = { ...rowSelection.value, [id]: true }
    return true
  }

  function trySelectMany(ids: string[], selected: boolean) {
    if (!selected) {
      const drop = new Set(ids)
      rowSelection.value = Object.fromEntries(
        Object.entries(rowSelection.value).filter(([key]) => !drop.has(key)),
      )
      return
    }
    const next = { ...rowSelection.value }
    let blocked = false
    let count = Object.values(next).filter(Boolean).length
    for (const id of ids) {
      if (next[id]) continue
      if (count >= max) {
        blocked = true
        continue
      }
      next[id] = true
      count++
    }
    rowSelection.value = next
    if (blocked) {
      toast.add({
        title: `Maximum ${max} éléments sélectionnés`,
        color: 'warning',
      })
    }
  }

  function applyResult(result: BulkMutationResult) {
    if (result.failed?.length) {
      rowSelection.value = Object.fromEntries(
        result.failed.map(item => [String(item.id), true]),
      )
      return
    }
    clearSelection()
  }

  function resultDescription(result: BulkMutationResult) {
    const parts: string[] = []
    if (result.failed?.length) {
      parts.push(`${result.failed.length} échec(s)`)
    }
    if (result.skippedHomeIds?.length) {
      parts.push('page d’accueil ignorée')
    }
    if (result.missingIds?.length) {
      parts.push(`${result.missingIds.length} introuvable(s)`)
    }
    return parts.join(' · ') || undefined
  }

  async function runBulkAction(
    action: BulkPageAction,
    extra?: Record<string, unknown>,
  ): Promise<BulkMutationResult | null> {
    if (!selectedIds.value.length || bulkLoading.value) return null

    bulkLoading.value = true
    try {
      const result = await $api<BulkMutationResult>(`${toValue(options.endpoint)}/bulk`, {
        method: 'POST',
        body: {
          ids: selectedIds.value,
          action,
          ...extra,
        },
      })
      toast.add({
        title: bulkSuccessTitle(noun.value, result.action, result.count),
        description: resultDescription(result),
        color: result.failed?.length ? 'warning' : 'success',
      })
      if (!result.failed?.length) {
        deleteConfirmOpen.value = false
      }
      applyResult(result)
      await options.refresh()
      return result
    }
    catch (error) {
      toast.add({
        title: action === 'move' ? 'Déplacement impossible' : 'Action impossible',
        description: getApiErrorMessage(error),
        color: 'error',
      })
      return null
    }
    finally {
      bulkLoading.value = false
    }
  }

  async function confirmBulkDelete(close: () => void) {
    const result = await runBulkAction('delete')
    if (result && !result.failed?.length) close()
  }

  return {
    rowSelection,
    bulkLoading,
    deleteConfirmOpen,
    selectedIds,
    selectedCount,
    selectedHint,
    canBulkChangeStatus,
    deleteConfirmDescription,
    bulkStatusItems,
    clearSelection,
    trySelect,
    trySelectMany,
    runBulkAction,
    confirmBulkDelete,
  }
}
