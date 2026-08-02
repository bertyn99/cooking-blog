<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import {
  CONTENT_IMAGE_ASPECTS,
  DEFAULT_CONTENT_IMAGE_ASPECT,
  isContentImageAspect,
  parseImageAspectFromTitle,
  pathnameFromContentImageSrc,
  type ContentImageAspect,
} from '#shared/content-image'
import { mediaAltFromPathname } from '~/utils/media'

const props = defineProps<{
  editor: Editor | null
}>()

const open = defineModel<boolean>('open', { default: false })

const { $api } = useNuxtApp()

const altDraft = ref('')
const aspectDraft = ref<ContentImageAspect | 'default'>('default')
const mediaDefaultAlt = ref<string | null>(null)
const loadingDefault = ref(false)
/** Node position captured when opening (selection may drop when modal focuses). */
const imagePos = ref<number | null>(null)

async function loadMediaDefault(src: string) {
  const pathname = pathnameFromContentImageSrc(src)
  if (!pathname) {
    mediaDefaultAlt.value = null
    return
  }
  loadingDefault.value = true
  try {
    const detail = await $api<{ altText?: string | null }>('/api/media/item', {
      query: { pathname },
    })
    mediaDefaultAlt.value = detail.altText?.trim() || mediaAltFromPathname(pathname)
  }
  catch {
    mediaDefaultAlt.value = mediaAltFromPathname(pathname)
  }
  finally {
    loadingDefault.value = false
  }
}

watch(open, async (isOpen) => {
  if (!isOpen) {
    imagePos.value = null
    return
  }
  const editor = props.editor
  if (!editor?.isActive('image')) {
    open.value = false
    return
  }

  imagePos.value = editor.state.selection.from
  const attrs = editor.getAttributes('image') as {
    alt?: string | null
    title?: string | null
    src?: string | null
  }
  altDraft.value = attrs.alt ?? ''
  aspectDraft.value = parseImageAspectFromTitle(attrs.title) ?? 'default'
  await loadMediaDefault(attrs.src ?? '')
})

const aspectItems = [
  { label: `Défaut (${DEFAULT_CONTENT_IMAGE_ASPECT})`, value: 'default' as const },
  ...CONTENT_IMAGE_ASPECTS.map(item => ({
    label: item.label,
    value: item.value,
  })),
]

const defaultAltHint = computed(() => mediaDefaultAlt.value || '—')

function applyChanges() {
  const editor = props.editor
  const pos = imagePos.value
  if (!editor || pos == null) {
    open.value = false
    return
  }

  const trimmedAlt = altDraft.value.trim()
  const title = aspectDraft.value === 'default' || !isContentImageAspect(aspectDraft.value)
    ? null
    : aspectDraft.value

  editor
    .chain()
    .focus()
    .setNodeSelection(pos)
    .updateAttributes('image', {
      alt: trimmedAlt || mediaDefaultAlt.value || '',
      title,
    })
    .run()
  open.value = false
}

function useMediaDefaultAlt() {
  if (mediaDefaultAlt.value) {
    altDraft.value = mediaDefaultAlt.value
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Image dans l’article"
    description="Alt et format propres à cet article. Laissez l’alt vide pour reprendre le défaut de la médiathèque."
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField
          label="Texte alternatif"
          :help="`Défaut média : ${defaultAltHint}`"
        >
          <div class="flex gap-1.5">
            <UInput
              v-model="altDraft"
              class="min-w-0 flex-1"
              :loading="loadingDefault"
              placeholder="Décrire l’image pour cet article"
              @keydown.enter.prevent="applyChanges"
            />
            <UTooltip text="Reprendre le défaut média">
              <UButton
                icon="i-lucide-undo-2"
                color="neutral"
                variant="outline"
                :disabled="!mediaDefaultAlt"
                @click="useMediaDefaultAlt"
              />
            </UTooltip>
          </div>
        </UFormField>

        <UFormField
          label="Format"
          help='Stocké dans le markdown : ![alt](src "16:9").'
        >
          <USelect
            v-model="aspectDraft"
            :items="aspectItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Annuler"
          color="neutral"
          variant="ghost"
          @click="open = false"
        />
        <UButton
          label="Appliquer"
          @click="applyChanges"
        />
      </div>
    </template>
  </UModal>
</template>
