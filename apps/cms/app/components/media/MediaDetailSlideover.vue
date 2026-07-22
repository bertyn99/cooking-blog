<script setup lang="ts">
import { blobDefaultDescription } from '#shared/media-accessibility'
import { formatMediaByteSize } from '#shared/media'
import { mediaKindLabel, type MediaKind } from '#shared/media-paths'
import type { MediaDetailSection, MediaFileMetadata } from '#shared/media-file-metadata'
import { mediaPublicUrl, readApiErrorMessage } from '~/utils/media'
import { DASHBOARD_SURFACE_CLASS } from '~/utils/dashboard-shell'

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
const editAlt = ref('')
const editDescription = ref('')
const deleteOpen = ref(false)
const showTechnical = ref(false)

const displayTitle = computed(() =>
  detail.value?.originalName
  ?? detail.value?.pathname.split('/').pop()
  ?? 'Média',
)

const slideoverTitle = computed(() =>
  loading.value ? 'Détail du média' : displayTitle.value,
)

const savedDisplayName = computed(() =>
  detail.value?.originalName
  ?? detail.value?.pathname.split('/').pop()
  ?? '',
)

const renameDirty = computed(() => {
  if (!detail.value) {
    return false
  }
  return editName.value.trim() !== savedDisplayName.value.trim()
})

const savedAlt = computed(() => detail.value?.altText?.trim() ?? '')

const savedDescription = computed(() =>
  blobDefaultDescription(detail.value?.fileMetadata) ?? '',
)

const accessibilityDirty = computed(() => {
  if (!detail.value || detail.value.kind !== 'image') {
    return false
  }
  return editAlt.value.trim() !== savedAlt.value
    || editDescription.value.trim() !== savedDescription.value
})

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

function formatMimeShort(contentType?: string) {
  if (!contentType) {
    return ''
  }
  if (contentType === 'image/webp') {
    return 'WebP'
  }
  if (contentType.startsWith('image/')) {
    return contentType.slice(6).toUpperCase()
  }
  return contentType
}

const summaryParts = computed(() => {
  const d = detail.value
  if (!d) {
    return []
  }
  const parts: string[] = []
  if (d.size) {
    parts.push(formatMediaByteSize(d.size))
  }
  const mime = formatMimeShort(d.contentType)
  if (mime) {
    parts.push(mime)
  }
  if (d.width && d.height) {
    parts.push(`${d.width} x ${d.height} px`)
  }
  if (d.uploadedAt) {
    parts.push(new Date(d.uploadedAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }))
  }
  return parts
})

const copyMenuItems = computed(() => {
  if (!detail.value) {
    return []
  }
  return [[
    {
      label: 'Copier l\'URL publique',
      icon: 'i-lucide-link',
      onSelect: () => copyUrl(),
    },
    {
      label: 'Copier le chemin stockage',
      icon: 'i-lucide-folder-tree',
      onSelect: () => copyPath(),
    },
  ]]
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
    editAlt.value = detail.value.altText ?? ''
    editDescription.value = blobDefaultDescription(detail.value.fileMetadata) ?? ''
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
    showTechnical.value = false
    void loadDetail()
  }
}, { immediate: true })

async function saveRename() {
  if (!detail.value || !renameDirty.value) {
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
    editName.value = detail.value.originalName ?? detail.value.pathname.split('/').pop() ?? ''
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

async function saveAccessibility() {
  if (!detail.value || !accessibilityDirty.value) {
    return
  }
  saving.value = true
  try {
    detail.value = await $api<MediaDetail>('/api/media/item', {
      method: 'PATCH',
      body: {
        pathname: detail.value.pathname,
        altText: editAlt.value.trim() || null,
        description: editDescription.value.trim() || null,
      },
    })
    editAlt.value = detail.value.altText ?? ''
    editDescription.value = blobDefaultDescription(detail.value.fileMetadata) ?? ''
    toast.add({ title: 'Accessibilité enregistrée', color: 'success' })
    emit('updated')
  }
  catch (error: unknown) {
    toast.add({
      title: 'Échec de l\'enregistrement',
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

async function copyText(label: string, text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: label, color: 'neutral' })
  }
  catch {
    toast.add({ title: 'Copie impossible', color: 'warning' })
  }
}

function copyPath() {
  if (!detail.value) {
    return
  }
  void copyText('Chemin copié', detail.value.pathname)
}

function copyUrl() {
  if (!detail.value) {
    return
  }
  void copyText('URL copiée', detail.value.url)
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="slideoverTitle"
    :ui="{
      content: 'sm:max-w-md',
      body: 'flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0 sm:p-0',
      footer: 'shrink-0 border-t border-default/70 bg-default',
    }"
  >
    <template
      v-if="detail && !loading"
      #title
    >
      <div class="flex min-w-0 items-center gap-2 pe-8">
        <span class="truncate font-semibold text-highlighted">
          {{ displayTitle }}
        </span>
        <UBadge
          :color="kindColor"
          variant="subtle"
          size="sm"
          class="shrink-0"
        >
          {{ mediaKindLabel(detail.kind) }}
        </UBadge>
      </div>
    </template>

    <template #body>
      <div
        v-if="loading"
        class="space-y-4 p-4 sm:p-5"
      >
        <USkeleton class="h-44 w-full rounded-lg" />
        <USkeleton class="h-4 w-2/3" />
        <USkeleton class="h-10 w-full" />
      </div>

      <template v-else-if="detail">
        <div
          class="media-preview-checker shrink-0 border-b border-default/70 px-3 py-3 sm:px-4"
        >
          <div class="flex h-40 items-center justify-center sm:h-44">
            <img
              v-if="detail.kind === 'image'"
              :src="mediaPublicUrl(detail.pathname)"
              :alt="displayTitle"
              class="max-h-full max-w-full rounded-sm object-contain shadow-sm ring-1 ring-default/40"
            >
            <div
              v-else
              class="flex flex-col items-center gap-2 text-muted"
            >
              <UIcon
                name="i-lucide-file"
                class="size-12"
              />
              <span class="text-sm">{{ mediaKindLabel(detail.kind) }}</span>
            </div>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <p
            v-if="summaryParts.length"
            class="text-sm text-muted"
          >
            {{ summaryParts.join(', ') }}
          </p>

          <div class="mt-4 space-y-3">
            <UFormField
              label="Nom affiché"
              help="Utilisé dans la grille et les sélecteurs de couverture."
            >
              <div class="flex gap-2">
                <UInput
                  v-model="editName"
                  class="min-w-0 flex-1"
                  @keydown.enter.prevent="saveRename"
                />
                <UButton
                  icon="i-lucide-check"
                  aria-label="Enregistrer le nom"
                  :color="renameDirty ? 'primary' : 'neutral'"
                  :variant="renameDirty ? 'solid' : 'outline'"
                  :loading="saving"
                  :disabled="!renameDirty || !editName.trim()"
                  @click="saveRename"
                />
              </div>
            </UFormField>

            <template v-if="detail.kind === 'image'">
              <UFormField
                label="Texte alternatif (fichier)"
                help="Valeur par défaut pour toutes les utilisations de ce média."
              >
                <UInput v-model="editAlt" placeholder="Texte alternatif" />
              </UFormField>

              <UFormField
                label="Description (fichier)"
                help="Importée depuis Strapi ou saisie ici."
              >
                <UTextarea
                  v-model="editDescription"
                  :rows="2"
                  autoresize
                  placeholder="Description"
                />
              </UFormField>

              <UButton
                icon="i-lucide-check"
                label="Enregistrer l’accessibilité"
                size="sm"
                :color="accessibilityDirty ? 'primary' : 'neutral'"
                :variant="accessibilityDirty ? 'solid' : 'outline'"
                :loading="saving"
                :disabled="!accessibilityDirty"
                @click="saveAccessibility"
              />
            </template>
          </div>

          <div class="mt-5 border-t border-default/60 pt-3">
            <UButton
              :icon="showTechnical ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              :label="showTechnical ? 'Masquer le stockage' : 'Chemin et détails techniques'"
              color="neutral"
              variant="ghost"
              size="sm"
              class="-ms-2"
              @click="showTechnical = !showTechnical"
            />

            <div
              v-show="showTechnical"
              class="mt-3 space-y-3"
            >
              <div :class="[DASHBOARD_SURFACE_CLASS, 'flex items-start gap-2 p-3']">
                <code class="min-w-0 flex-1 break-all text-xs text-toned">{{ detail.pathname }}</code>
                <UButton
                  icon="i-lucide-copy"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  aria-label="Copier le chemin"
                  @click="copyPath"
                />
              </div>

              <p
                v-if="detail.contentType"
                class="text-xs text-muted"
              >
                Type MIME : {{ detail.contentType }}
              </p>

              <section
                v-for="section in detail.extraSections"
                :key="section.id"
                :class="[DASHBOARD_SURFACE_CLASS, 'space-y-2 p-3']"
              >
                <h3 class="text-sm font-medium text-highlighted">
                  {{ section.title }}
                </h3>
                <dl class="space-y-1.5 text-sm">
                  <div
                    v-for="field in section.fields"
                    :key="`${section.id}-${field.label}`"
                    class="flex justify-between gap-3"
                  >
                    <dt class="shrink-0 text-muted">
                      {{ field.label }}
                    </dt>
                    <dd class="break-words text-right text-highlighted">
                      {{ field.value }}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>
        </div>
      </template>
    </template>

    <template
      v-if="detail && !loading"
      #footer
    >
      <div class="flex w-full items-center gap-2">
        <UButton
          v-if="detail.kind === 'image'"
          :to="detail.url"
          target="_blank"
          icon="i-lucide-external-link"
          label="Ouvrir"
          size="sm"
        />
        <UDropdownMenu :items="copyMenuItems">
          <UButton
            icon="i-lucide-copy"
            label="Copier"
            color="neutral"
            variant="outline"
            size="sm"
          />
        </UDropdownMenu>
        <UButton
          icon="i-lucide-trash-2"
          label="Supprimer"
          color="error"
          variant="ghost"
          size="sm"
          class="ms-auto"
          @click="deleteOpen = true"
        />
      </div>
    </template>
  </USlideover>

  <UModal
    v-model:open="deleteOpen"
    title="Supprimer ce fichier ?"
  >
    <template #body>
      <p class="text-sm text-muted">
        Le fichier sera retiré du stockage et de la médiathèque. Les couvertures liées seront détachées.
      </p>
    </template>
    <template #footer>
      <UButton
        label="Annuler"
        color="neutral"
        variant="ghost"
        @click="deleteOpen = false"
      />
      <UButton
        label="Supprimer"
        color="error"
        :loading="deleting"
        @click="confirmDelete"
      />
    </template>
  </UModal>
</template>

<style scoped>
.media-preview-checker {
  background-color: color-mix(in oklab, var(--ui-bg-muted) 50%, transparent);
  background-image:
    linear-gradient(45deg, color-mix(in oklab, var(--ui-border) 35%, transparent) 25%, transparent 25%),
    linear-gradient(-45deg, color-mix(in oklab, var(--ui-border) 35%, transparent) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, color-mix(in oklab, var(--ui-border) 35%, transparent) 75%),
    linear-gradient(-45deg, transparent 75%, color-mix(in oklab, var(--ui-border) 35%, transparent) 75%);
  background-size: 12px 12px;
  background-position:
    0 0,
    0 6px,
    6px -6px,
    -6px 0;
}
</style>
