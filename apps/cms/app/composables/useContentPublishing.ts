import type { CalendarDate } from '@internationalized/date'
import type { ContentStatus } from '~/types/cms'
import { scheduledAtIsoForDay } from '~/composables/usePublishingCalendar'

export type AdminPublishContentType =
  | 'articles'
  | 'recipes'
  | 'pages'
  | 'categories'
  | 'category-articles'

export function useContentPublishing(contentType: AdminPublishContentType) {
  const { $api } = useNuxtApp()
  const toast = useToast()
  const publishing = ref(false)
  const scheduling = ref(false)
  const unpublishing = ref(false)

  async function publishNow(ensureId: () => Promise<number | undefined>) {
    publishing.value = true
    try {
      const id = await ensureId()
      if (!id) return null

      await $api(`/api/admin/${contentType}/${id}/publish`, { method: 'POST' })
      toast.add({ title: 'Contenu publié', color: 'success' })
      return 'published' as const
    }
    catch {
      toast.add({
        title: 'Erreur',
        description: 'Impossible de publier',
        color: 'error',
      })
      return null
    }
    finally {
      publishing.value = false
    }
  }

  async function scheduleOnDay(
    ensureId: () => Promise<number | undefined>,
    dayKeyOrDate: string | CalendarDate,
  ) {
    scheduling.value = true
    try {
      const id = await ensureId()
      if (!id) return null

      const dayKey = typeof dayKeyOrDate === 'string'
        ? dayKeyOrDate
        : `${dayKeyOrDate.year}-${String(dayKeyOrDate.month).padStart(2, '0')}-${String(dayKeyOrDate.day).padStart(2, '0')}`
      const scheduledAt = scheduledAtIsoForDay(dayKey)

      await $api(`/api/admin/${contentType}/${id}/schedule`, {
        method: 'POST',
        body: { scheduledAt },
      })

      const scheduledDate = new Date(scheduledAt)
      const isPast = scheduledDate.getTime() < Date.now()
      toast.add({
        title: isPast ? 'Publication en cours' : 'Publication planifiée',
        description: isPast
          ? 'La date est passée : le contenu sera publié sous peu.'
          : `Prévu le ${scheduledDate.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })} à 9h`,
        color: 'success',
      })
      return 'scheduled' as const satisfies ContentStatus
    }
    catch {
      toast.add({
        title: 'Erreur',
        description: 'Impossible de planifier',
        color: 'error',
      })
      return null
    }
    finally {
      scheduling.value = false
    }
  }

  async function unpublishNow(ensureId: () => Promise<number | undefined>) {
    unpublishing.value = true
    try {
      const id = await ensureId()
      if (!id) return null

      await $api(`/api/admin/${contentType}/${id}/unpublish`, { method: 'POST' })
      toast.add({ title: 'Contenu dépublié', color: 'success' })
      return 'draft' as const
    }
    catch {
      toast.add({
        title: 'Erreur',
        description: 'Impossible de dépublier',
        color: 'error',
      })
      return null
    }
    finally {
      unpublishing.value = false
    }
  }

  return {
    publishing,
    scheduling,
    unpublishing,
    publishNow,
    scheduleOnDay,
    unpublishNow,
  }
}
