<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import type { EditorToolbarItem } from '@nuxt/ui'
import { mediaAltFromPathname, mediaPublicUrl } from '~/utils/media'
import { useDeferredArticleMedia } from '~/composables/useDeferredArticleMedia'

const model = defineModel<string>({ required: true })

const deferredMedia = useDeferredArticleMedia()
const deferUpload = computed(() => Boolean(deferredMedia))

const preview = ref(false)
const mediaPickerOpen = ref(false)
const pickerMode = ref<'insert' | 'replace'>('insert')
const activeEditor = shallowRef<Editor | null>(null)

function openMediaPicker(mode: 'insert' | 'replace', editor: Editor) {
  activeEditor.value = editor
  pickerMode.value = mode
  mediaPickerOpen.value = true
}

function applyMediaToEditor(pathname: string) {
  applyImageToEditor(mediaPublicUrl(pathname), mediaAltFromPathname(pathname))
}

function applyLocalMediaToEditor(payload: { previewUrl: string, file: File }) {
  deferredMedia?.registerLocal(payload)
  applyImageToEditor(payload.previewUrl, mediaAltFromPathname(payload.file.name))
}

function applyImageToEditor(src: string, alt: string) {
  const editor = activeEditor.value
  if (!editor) {
    return
  }

  if (pickerMode.value === 'replace' && editor.isActive('image')) {
    editor.chain().focus().updateAttributes('image', { src, alt }).run()
  }
  else {
    editor.chain().focus().setImage({ src, alt }).run()
  }

  activeEditor.value = null
}

/** Fixed toolbar — aligned with Nuxt UI EditorExample item shapes. */
const fixedToolbarItems = [[{
  icon: 'i-lucide-heading',
  tooltip: { text: 'Titres' },
  content: { align: 'start' as const },
  items: [
    { kind: 'paragraph' as const, label: 'Paragraphe' },
    { kind: 'heading' as const, level: 2 as const, label: 'Titre 2' },
    { kind: 'heading' as const, level: 3 as const, label: 'Titre 3' },
    { kind: 'heading' as const, level: 4 as const, label: 'Titre 4' },
  ],
}], [{
  kind: 'mark' as const,
  mark: 'bold' as const,
  icon: 'i-lucide-bold',
  tooltip: { text: 'Gras' },
}, {
  kind: 'mark' as const,
  mark: 'italic' as const,
  icon: 'i-lucide-italic',
  tooltip: { text: 'Italique' },
}, {
  kind: 'mark' as const,
  mark: 'underline' as const,
  icon: 'i-lucide-underline',
  tooltip: { text: 'Souligné' },
}, {
  kind: 'mark' as const,
  mark: 'strike' as const,
  icon: 'i-lucide-strikethrough',
  tooltip: { text: 'Barré' },
}], [{
  kind: 'bulletList' as const,
  icon: 'i-lucide-list',
  tooltip: { text: 'Liste à puces' },
}, {
  kind: 'orderedList' as const,
  icon: 'i-lucide-list-ordered',
  tooltip: { text: 'Liste numérotée' },
}, {
  kind: 'codeBlock' as const,
  icon: 'i-lucide-code',
  tooltip: { text: 'Bloc de code' },
}, {
  slot: 'media' as const,
  icon: 'i-lucide-image',
  tooltip: { text: 'Insérer une image (médiathèque)' },
}, {
  slot: 'link' as const,
  icon: 'i-lucide-link',
}, {
  kind: 'blockquote' as const,
  icon: 'i-lucide-quote',
  tooltip: { text: 'Citation' },
}]] satisfies EditorToolbarItem[][]

const bubbleToolbarItems = [[{
  kind: 'mark' as const,
  mark: 'bold' as const,
  icon: 'i-lucide-bold',
  tooltip: { text: 'Gras' },
}, {
  kind: 'mark' as const,
  mark: 'italic' as const,
  icon: 'i-lucide-italic',
  tooltip: { text: 'Italique' },
}, {
  kind: 'mark' as const,
  mark: 'underline' as const,
  icon: 'i-lucide-underline',
  tooltip: { text: 'Souligné' },
}, {
  kind: 'mark' as const,
  mark: 'strike' as const,
  icon: 'i-lucide-strikethrough',
  tooltip: { text: 'Barré' },
}], [{
  slot: 'link' as const,
  icon: 'i-lucide-link',
}]] satisfies EditorToolbarItem[][]

function textBubbleShouldShow({
  editor,
  view,
  state,
}: {
  editor: Editor
  view: { hasFocus: () => boolean }
  state: Editor['state']
}) {
  if (editor.isActive('image')) {
    return false
  }
  const { selection } = state
  return view.hasFocus() && !selection.empty
}

const imageBubbleItems = (editor: Editor): EditorToolbarItem[] => [
  {
    icon: 'i-lucide-image-plus',
    label: 'Remplacer',
    onClick: () => openMediaPicker('replace', editor),
  },
  {
    icon: 'i-lucide-trash-2',
    label: 'Supprimer',
    color: 'error',
    onClick: () => {
      if (editor.isActive('image')) {
        editor.chain().focus().deleteNode('image').run()
      }
      else {
        editor.chain().focus().deleteSelection().run()
      }
    },
  },
]

function imageBubbleShouldShow({ editor, view }: { editor: Editor, view: { hasFocus: () => boolean } }) {
  return editor.isActive('image') && view.hasFocus()
}
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-default bg-default">
    <div class="px-3 pt-3">
      <ContentFieldLabel label="content" />
    </div>

    <ClientOnly>
      <UEditor
        v-slot="{ editor }"
        v-model="model"
        content-type="markdown"
        :editable="!preview"
        placeholder="Rédigez le contenu…"
        class="min-h-[22rem] w-full"
        :starter-kit="{
          headings: { levels: [2, 3, 4] },
          link: { openOnClick: false },
        }"
        :ui="{
          root: 'flex flex-col',
          base: preview ? 'pointer-events-none opacity-90' : '',
        }"
      >
        <div
          class="flex flex-wrap items-center gap-1 border-y border-default bg-elevated/40 px-2 py-1.5"
          :class="preview ? 'opacity-60' : ''"
        >
          <UEditorToolbar
            v-if="!preview"
            :editor="editor"
            :items="fixedToolbarItems"
            layout="fixed"
            class="flex-1 overflow-x-auto"
          >
            <template #link>
              <ContentEditorLinkPopover
                :editor="editor"
                auto-open
              />
            </template>
            <template #media>
              <UTooltip text="Insérer une image (médiathèque)">
                <UButton
                  icon="i-lucide-image"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="openMediaPicker('insert', editor)"
                />
              </UTooltip>
            </template>
          </UEditorToolbar>

          <UButton
            v-if="!preview"
            class="ml-auto shrink-0"
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-eye"
            label="Preview mode"
            @click="preview = true"
          />
          <UButton
            v-else
            class="ml-auto shrink-0"
            size="xs"
            color="primary"
            variant="soft"
            icon="i-lucide-pencil"
            label="Quitter l’aperçu"
            @click="preview = false"
          />
        </div>

        <UEditorToolbar
          v-if="!preview"
          :editor="editor"
          :items="bubbleToolbarItems"
          layout="bubble"
          :should-show="textBubbleShouldShow"
        >
          <template #link>
            <ContentEditorLinkPopover :editor="editor" />
          </template>
        </UEditorToolbar>

        <UEditorToolbar
          v-if="!preview"
          :editor="editor"
          :items="imageBubbleItems(editor)"
          layout="bubble"
          :should-show="imageBubbleShouldShow"
        />
      </UEditor>

      <ContentMediaPickerModal
        v-model:open="mediaPickerOpen"
        :title="pickerMode === 'replace' ? 'Remplacer l\'image' : 'Insérer une image'"
        :defer-upload="deferUpload"
        @select="applyMediaToEditor"
        @select-local="applyLocalMediaToEditor"
      />

      <template #fallback>
        <UTextarea
          v-model="model"
          :rows="18"
          class="min-h-[22rem] w-full font-mono"
          placeholder="Chargement de l’éditeur…"
        />
      </template>
    </ClientOnly>
  </div>
</template>
