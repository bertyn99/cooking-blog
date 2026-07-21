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

function buildToolbarItems(editor: Editor): EditorToolbarItem[][] {
  return [
    [
      {
        label: 'Titres',
        icon: 'i-lucide-heading',
        items: [
          { kind: 'paragraph', label: 'Paragraphe' },
          { kind: 'heading', level: 2, label: 'Titre 2' },
          { kind: 'heading', level: 3, label: 'Titre 3' },
          { kind: 'heading', level: 4, label: 'Titre 4' },
        ],
      },
    ],
    [
      { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Gras' } },
      { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Italique' } },
      { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', tooltip: { text: 'Souligné' } },
      { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Barré' } },
    ],
    [
      { kind: 'bulletList', icon: 'i-lucide-list', tooltip: { text: 'Liste à puces' } },
      { kind: 'orderedList', icon: 'i-lucide-list-ordered', tooltip: { text: 'Liste numérotée' } },
      { kind: 'codeBlock', icon: 'i-lucide-code', tooltip: { text: 'Bloc de code' } },
      {
        icon: 'i-lucide-image',
        tooltip: { text: 'Insérer une image (médiathèque)' },
        onClick: () => openMediaPicker('insert', editor),
      },
      { kind: 'link', icon: 'i-lucide-link', tooltip: { text: 'Lien' } },
      { kind: 'blockquote', icon: 'i-lucide-quote', tooltip: { text: 'Citation' } },
    ],
  ]
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

function imageBubbleShouldShow({ editor }: { editor: Editor }) {
  return editor.isActive('image')
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
            :items="buildToolbarItems(editor)"
            layout="fixed"
            class="flex-1"
          />
          <UButton
            v-if="!preview"
            class="ml-auto"
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-eye"
            label="Preview mode"
            @click="preview = true"
          />
          <UButton
            v-else
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
