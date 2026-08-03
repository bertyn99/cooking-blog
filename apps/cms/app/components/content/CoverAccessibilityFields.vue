<script setup lang="ts">
import { blobDefaultDescription } from '#shared/media-accessibility'
import type { MediaFileMetadata } from '#shared/media-file-metadata'

const coverBlobPathname = defineModel<string | null>('coverBlobPathname', { required: true })
const coverAltText = defineModel<string | null>('coverAltText', { default: null })
const coverDescription = defineModel<string | null>('coverDescription', { default: null })

const props = defineProps<{
  contentTitle?: string
  /** Show alt/description fields before a blob pathname exists (deferred local cover). */
  allowDeferred?: boolean
}>()

const { $api } = useNuxtApp()

interface BlobDefaults {
  altText?: string | null
  fileMetadata?: MediaFileMetadata | null
}

const blobDefaults = ref<BlobDefaults | null>(null)
const loadingDefaults = ref(false)

async function loadBlobDefaults(pathname: string | null) {
  if (!pathname) {
    blobDefaults.value = null
    return
  }
  loadingDefaults.value = true
  try {
    const detail = await $api<{ altText?: string | null, fileMetadata?: MediaFileMetadata | null }>(
      '/api/media/item',
      { query: { pathname } },
    )
    blobDefaults.value = {
      altText: detail.altText,
      fileMetadata: detail.fileMetadata,
    }
  }
  catch {
    blobDefaults.value = null
  }
  finally {
    loadingDefaults.value = false
  }
}

watch(coverBlobPathname, pathname => void loadBlobDefaults(pathname), { immediate: true })

const defaultAltHint = computed(() => {
  const fromBlob = blobDefaults.value?.altText?.trim()
  if (fromBlob) {
    return fromBlob
  }
  const fromTitle = props.contentTitle?.trim()
  return fromTitle || '—'
})

const defaultDescriptionHint = computed(() => {
  const fromBlob = blobDefaultDescription(blobDefaults.value?.fileMetadata)
  return fromBlob || '—'
})

const showFields = computed(() =>
  Boolean(coverBlobPathname.value) || loadingDefaults.value || props.allowDeferred,
)

function normalizeOverride(value: string | null | undefined): string | null {
  if (value == null) {
    return null
  }
  const trimmed = value.trim()
  return trimmed || null
}

const altDisplay = computed({
  get: () => coverAltText.value ?? '',
  set: (value: string) => {
    coverAltText.value = normalizeOverride(value)
  },
})

const descriptionDisplay = computed({
  get: () => coverDescription.value ?? '',
  set: (value: string) => {
    coverDescription.value = normalizeOverride(value)
  },
})
</script>

<template>
  <div
    v-if="showFields"
    class="space-y-3"
  >
    <UFormField
      label="Texte alternatif (couverture)"
      :help="`Défaut du fichier : ${defaultAltHint}`"
    >
      <UInput
        v-model="altDisplay"
        class="w-full"
        :loading="loadingDefaults"
        placeholder="Personnaliser l’alt de cette couverture"
      />
    </UFormField>

    <UFormField
      label="Description (couverture)"
      :help="`Défaut du fichier : ${defaultDescriptionHint}`"
    >
      <UTextarea
        v-model="descriptionDisplay"
        class="w-full"
        :rows="2"
        autoresize
        :loading="loadingDefaults"
        placeholder="Personnaliser la description de cette couverture"
      />
    </UFormField>
  </div>
  <p
    v-else
    class="text-sm text-muted"
  >
    Choisissez une image de couverture pour personnaliser l’alt et la description.
  </p>
</template>
