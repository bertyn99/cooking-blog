<script setup lang="ts">
import { formatMediaByteSize } from '#shared/media'
import { mediaKindLabel, type MediaKind } from '#shared/media-paths'
import type { MediaDetailSection, MediaFileMetadata } from '#shared/media-file-metadata'
import { mediaPublicUrl, readApiErrorMessage } from '~/utils/media'

export interface MediaDetail {
  pathname: string
  contentType?: string
  size?: number
  uploadedAt?: string
  updatedAt?: string
  originalName?: string
  width?: number
  height?: number
  altText?: string
  kind: MediaKind
  url: string
  storageSize?: number
  etag?: string
  fileMetadata?: MediaFileMetadata | null
  extraSections?: MediaDetailSection[]
}

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  pathname: string | null
}>()

const emit = defineEmits<{
  updated: []
  deleted: []
}>()

const { $api } = useNuxtApp()
const toast = useToast()

const detail = ref<MediaDetail | null>(null)
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editName = ref('')
const deleteOpen = ref(false)
const showMore = ref(false)

const hasExtraInfo = computed(() => (detail.value?.extraSections?.length ?? 0) > 0)

const displayTitle = computed(() =>
  detail.value?.originalName
  ?? detail.value?.pathname.split('/').pop()
  ?? 'Média',
)

const kindColor = computed(() => {
  switch (detail.value?.kind) {
    case 'image':
      return 'primary' as const
    case 'folder':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
})

async function loadDetail() {
  if (!props.pathname) {
    detail.value = null
    return
  }
  loading.value = true
  try {
    detail.value = await $api<MediaDetail>('/api/media/item', {
      query: { pathname: props.pathname },
    })
    editName.value = detail.value.originalName ?? detail.value.pathname.split('/').pop() ?? ''
  }
  catch (error: unknown) {
    toast.add({
      title: 'Impossible de charger le média',
      description: readApiErrorMessage(error, 'Réessayez.'),
      color: 'error',
    })
    open.value = false
  }
  finally {
    loading.value = false
  }
}

watch([open, () => props.pathname], ([isOpen]) => {
  if (isOpen && props.pathname) {
    showMore.value = false
    void loadDetail()
  }
}, { immediate: true })

async function saveRename() {
  if (!detail.value) {
    return
  }
  saving.value = true
  try {
    detail.value = await $api<MediaDetail>('/api/media/item', {
      method: 'PATCH',
      body: {
        pathname: detail.value.pathname,
        originalName: editName.value,
      },
    })
    toast.add({ title: 'Nom mis à jour', color: 'success' })
    emit('updated')
  }
  catch (error: unknown) {
    toast.add({
      title: 'Échec du renommage',
      description: readApiErrorMessage(error, 'Réessayez.'),
      color: 'error',
    })
  }
  finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!detail.value) {
    return
  }
  deleting.value = true
  try {
    await $api('/api/media/item', {
      method: 'DELETE',
      body: { pathname: detail.value.pathname },
    })
    toast.add({ title: 'Média supprimé', color: 'success' })
    deleteOpen.value = false
    open.value = false
    emit('deleted')
  }
  catch (error: unknown) {
    toast.add({
      title: 'Suppression impossible',
      description: readApiErrorMessage(error, 'Réessayez.'),
      color: 'error',
    })
  }
  finally {
    deleting.value = false
  }
}

function copyPath() {
  if (!detail.value) {
    return
  }
  void navigator.clipboard.writeText(detail.value.pathname)
  toast.add({ title: 'Chemin copié', color: 'neutral' })
}
</script>

<template>
  <USlideover v-model:open="open" :title="displayTitle" :ui="{ width: 'sm:max-w-md' }">
    <template #body>
      <div v-if="loading" class="space-y-4">
        <USkeleton class="aspect-video w-full rounded-lg" />
        <USkeleton class="h-8 w-full" />
        <USkeleton class="h-24 w-full" />
      </div>

      <div v-else-if="detail" class="space-y-5">
        <div class="overflow-hidden rounded-xl border border-default bg-elevated/30">
          <img
            v-if="detail.kind === 'image'"
            :src="mediaPublicUrl(detail.pathname)"
            :alt="displayTitle"
            class="max-h-64 w-full object-contain"
          >
          <div
            v-else
            class="flex aspect-video flex-col items-center justify-center gap-2 text-muted"
          >
            <UIcon name="i-lucide-file" class="size-12" />
            <UBadge :color="kindColor" variant="subtle">
              {{ mediaKindLabel(detail.kind) }}
            </UBadge>
          </div>
        </div>

        <UBadge :color="kindColor" variant="subtle" size="sm">
          {{ mediaKindLabel(detail.kind) }}
        </UBadge>

        <UFormField label="Nom affiché">
          <div class="flex gap-2">
            <UInput v-model="editName" class="flex-1" />
            <UButton
              icon="i-lucide-save"
              label="Enregistrer"
              :loading="saving"
              :disabled="!editName.trim()"
              @click="saveRename"
            />
          </div>
        </UFormField>

        <dl class="space-y-2 text-sm">
          <div v-if="detail.altText" class="flex justify-between gap-4">
            <dt class="text-muted">
              Texte alternatif
            </dt>
            <dd class="max-w-[55%] text-right">
              {{ detail.altText }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-muted">
              Taille
            </dt>
            <dd>{{ detail.size ? formatMediaByteSize(detail.size) : '—' }}</dd>
          </div>
          <div v-if="detail.width && detail.height" class="flex justify-between gap-4">
            <dt class="text-muted">
              Dimensions
            </dt>
            <dd>{{ detail.width }} × {{ detail.height }}</dd>
          </div>
          <div v-if="detail.uploadedAt" class="flex justify-between gap-4">
            <dt class="text-muted">
              Ajouté le
            </dt>
            <dd>{{ new Date(detail.uploadedAt).toLocaleString('fr-FR') }}</dd>
          </div>
        </dl>

        <div v-if="hasExtraInfo" class="border-t border-default pt-3">
          <UButton
            :icon="showMore ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            :label="showMore ? 'Masquer les détails' : 'Afficher plus d\'informations'"
            color="neutral"
            variant="ghost"
            class="w-full justify-center"
            @click="showMore = !showMore"
          />

          <div v-show="showMore" class="mt-4 space-y-5">
            <section
              v-for="section in detail.extraSections"
              :key="section.id"
              class="space-y-2"
            >
              <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">
                {{ section.title }}
              </h3>
              <dl class="space-y-2 text-sm">
                <div
                  v-for="field in section.fields"
                  :key="`${section.id}-${field.label}`"
                  class="flex justify-between gap-4"
                >
                  <dt class="shrink-0 text-muted">
                    {{ field.label }}
                  </dt>
                  <dd class="max-w-[60%] break-words text-right">
                    {{ field.value }}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            v-if="detail.kind === 'image'"
            :to="detail.url"
            target="_blank"
            icon="i-lucide-external-link"
            label="Ouvrir"
            color="neutral"
            variant="outline"
            size="sm"
          />
          <UButton
            icon="i-lucide-copy"
            label="Copier le chemin"
            color="neutral"
            variant="outline"
            size="sm"
            @click="copyPath"
          />
          <UButton
            icon="i-lucide-trash-2"
            label="Supprimer"
            color="error"
            variant="soft"
            size="sm"
            @click="deleteOpen = true"
          />
        </div>
      </div>
    </template>
  </USlideover>

  <UModal v-model:open="deleteOpen" title="Supprimer ce fichier ?">
    <template #body>
      <p class="text-sm text-muted">
        Le fichier sera retiré du stockage et de la médiathèque. Les couvertures liées seront détachées.
      </p>
    </template>
    <template #footer>
      <UButton label="Annuler" color="neutral" variant="ghost" @click="deleteOpen = false" />
      <UButton label="Supprimer" color="error" :loading="deleting" @click="confirmDelete" />
    </template>
  </UModal>
</template>
