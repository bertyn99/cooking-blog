<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import type { EditorCustomHandlers, EditorToolbarItem } from '@nuxt/ui'
import { DragHandle } from '@tiptap/extension-drag-handle-vue-3'
import { mediaAltFromPathname, mediaPublicUrl } from '~/utils/media'
import { useDeferredArticleMedia } from '~/composables/useDeferredArticleMedia'
import { ContentCallout } from '~/utils/editor-callout-extension'
import { ContentGridColumn } from '~/utils/editor-grid-column-extension'
import { ContentGrid } from '~/utils/editor-grid-extension'
import { ContentImage } from '~/utils/editor-image-extension'

const model = defineModel<string>({ required: true })

withDefaults(defineProps<{
  /** Inside ContentEditorSection + surface: no extra title or outer card. */
  embedded?: boolean
}>(), {
  embedded: true,
})

const deferredMedia = useDeferredArticleMedia()
const deferUpload = computed(() => Boolean(deferredMedia))
const { $api } = useNuxtApp()

const preview = ref(false)
const mediaPickerOpen = ref(false)
const linkPickerOpen = ref(false)
const imageSettingsOpen = ref(false)
const pickerMode = ref<'insert' | 'replace'>('insert')
const activeEditor = shallowRef<Editor | null>(null)
const editorComponentRef = useTemplateRef('editorComponentRef')

const {
  extension: completionExtension,
  highlightExtension: aiHighlightExtension,
  handlers: aiHandlers,
  isLoading: aiLoading,
  review: aiReview,
  acceptReview,
  refuseReview,
  redoReview,
  setActiveVariant,
  setProofreadDecision,
} = useEditorCompletion(editorComponentRef)

const editorHandlers = {
  ...aiHandlers,
} satisfies EditorCustomHandlers

const aiToolbarGroup = computed(() => [{
  icon: 'i-lucide-sparkles',
  label: 'IA',
  variant: 'soft' as const,
  loading: aiLoading.value,
  tooltip: { text: 'Assistance IA (Workers AI)' },
  content: { align: 'start' as const },
  items: [{
    kind: 'aiFix' as const,
    icon: 'i-lucide-spell-check',
    label: 'Orthographe & grammaire',
  }, {
    kind: 'aiExtend' as const,
    icon: 'i-lucide-unfold-vertical',
    label: 'Développer',
  }, {
    kind: 'aiReduce' as const,
    icon: 'i-lucide-fold-vertical',
    label: 'Raccourcir',
  }, {
    kind: 'aiSimplify' as const,
    icon: 'i-lucide-lightbulb',
    label: 'Simplifier',
  }, {
    kind: 'aiContinue' as const,
    icon: 'i-lucide-text',
    label: 'Continuer (⌘/Ctrl+J)',
  }, {
    kind: 'aiSummarize' as const,
    icon: 'i-lucide-list',
    label: 'Résumer',
  }, {
    icon: 'i-lucide-languages',
    label: 'Traduire',
    content: { align: 'start' as const },
    items: [{
      kind: 'aiTranslate' as const,
      language: 'English',
      label: 'Anglais',
    }, {
      kind: 'aiTranslate' as const,
      language: 'French',
      label: 'Français',
    }, {
      kind: 'aiTranslate' as const,
      language: 'Spanish',
      label: 'Espagnol',
    }],
  }],
}] satisfies EditorToolbarItem<typeof editorHandlers>[])

function openMediaPicker(mode: 'insert' | 'replace', editor: Editor) {
  activeEditor.value = editor
  pickerMode.value = mode
  mediaPickerOpen.value = true
}

async function resolveAltForPathname(pathname: string): Promise<string> {
  try {
    const detail = await $api<{ altText?: string | null }>('/api/media/item', {
      query: { pathname },
    })
    const fromMedia = detail.altText?.trim()
    if (fromMedia) {
      return fromMedia
    }
  }
  catch {
    // Fall through to filename-derived alt.
  }
  return mediaAltFromPathname(pathname)
}

async function applyMediaToEditor(pathname: string) {
  const src = mediaPublicUrl(pathname)
  const alt = await resolveAltForPathname(pathname)
  applyImageToEditor(src, alt)
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

  const currentTitle = pickerMode.value === 'replace' && editor.isActive('image')
    ? (editor.getAttributes('image').title as string | null | undefined) ?? null
    : null

  if (pickerMode.value === 'replace' && editor.isActive('image')) {
    editor.chain().focus().updateAttributes('image', {
      src,
      alt,
      'data-broken': null,
      ...(currentTitle ? { title: currentTitle } : {}),
    }).run()
  }
  else {
    editor.chain().focus().setImage({ src, alt }).run()
  }

  activeEditor.value = null
}

/** Fixed toolbar — aligned with Nuxt UI EditorExample item shapes. */
const fixedToolbarItems = computed(() => [
  aiToolbarGroup.value,
  [{
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
}], [{
  slot: 'callout' as const,
  icon: 'i-lucide-message-square-warning',
  tooltip: { text: 'Encadré (callout)' },
}, {
  slot: 'grid' as const,
  icon: 'i-lucide-layout-grid',
  tooltip: { text: 'Grille (colonnes)' },
}]] satisfies EditorToolbarItem<typeof editorHandlers>[][])

const bubbleToolbarItems = computed(() => [[{
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
  icon: 'i-lucide-link',
  tooltip: { text: 'Lien' },
  onClick: () => {
    linkPickerOpen.value = true
  },
}], [{
  icon: 'i-lucide-sparkles',
  label: 'IA',
  loading: aiLoading.value,
  content: { align: 'start' as const },
  items: [{
    kind: 'aiFix' as const,
    icon: 'i-lucide-spell-check',
    label: 'Orthographe',
  }, {
    kind: 'aiSimplify' as const,
    icon: 'i-lucide-lightbulb',
    label: 'Simplifier',
  }, {
    kind: 'aiExtend' as const,
    icon: 'i-lucide-unfold-vertical',
    label: 'Développer',
  }, {
    kind: 'aiContinue' as const,
    icon: 'i-lucide-text',
    label: 'Continuer',
  }],
}]] satisfies EditorToolbarItem<typeof editorHandlers>[][])

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
  if (!view.hasFocus()) {
    return false
  }
  return !selection.empty || editor.isActive('link')
}

const imageBubbleItems = (editor: Editor): EditorToolbarItem[][] => [
  [{
    icon: 'i-lucide-captions',
    label: 'Alt / format',
    onClick: () => {
      activeEditor.value = editor
      imageSettingsOpen.value = true
    },
  }],
  [{
    icon: 'i-lucide-image-plus',
    label: 'Remplacer',
    onClick: () => openMediaPicker('replace', editor),
  }, {
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
  }],
]

function imageBubbleShouldShow({ editor, view }: { editor: Editor, view: { hasFocus: () => boolean } }) {
  return editor.isActive('image') && view.hasFocus()
}
</script>

<template>
  <div
    class="cms-markdown-editor overflow-hidden"
    :class="[
      embedded ? 'cms-markdown-editor--embedded' : 'rounded-lg border border-default bg-default',
      preview ? 'cms-markdown-editor--preview' : '',
    ]"
  >
    <ClientOnly>
      <UEditor
        ref="editorComponentRef"
        v-slot="{ editor }"
        v-model="model"
        content-type="markdown"
        :editable="!preview"
        placeholder="Rédigez le contenu…"
        class="w-full"
        :class="embedded ? 'min-h-[20rem]' : 'min-h-[22rem]'"
        :handlers="editorHandlers"
        :editor-props="{
          attributes: {
            spellcheck: aiReview?.kind === 'proofread' ? 'false' : 'true',
          },
        }"
        :starter-kit="{
          headings: { levels: [2, 3, 4] },
          link: { openOnClick: false },
        }"
        :image="false"
        :extensions="[ContentImage, ContentCallout, ContentGridColumn, ContentGrid, completionExtension, aiHighlightExtension]"
        :ui="{
          root: 'flex min-h-0 flex-1 flex-col',
          content: 'min-h-0 flex-1',
          base: [
            preview ? 'pointer-events-none opacity-90' : '',
            embedded ? '!px-4 !pt-4 !pb-6 sm:!px-5' : '',
          ].filter(Boolean).join(' '),
        }"
      >
        <DragHandle
          v-if="editor && !preview"
          :editor="editor"
          :nested="{
            allowedContainers: ['gridColumn'],
            edgeDetection: { threshold: 16, strength: 400 },
          }"
          class="cms-editor-drag-handle"
        >
          <div
            class="flex size-6 items-center justify-center rounded-md border border-default bg-default text-muted shadow-sm hover:text-default"
            title="Déplacer le bloc"
          >
            <UIcon
              name="i-lucide-grip-vertical"
              class="size-3.5"
            />
          </div>
        </DragHandle>

        <div
          class="flex flex-wrap items-center gap-1 border-b border-default bg-elevated/55 px-2 py-2 sm:px-3"
          :class="[
            preview ? 'opacity-70' : '',
            embedded ? 'sticky top-0 z-[1] backdrop-blur-sm' : '',
          ]"
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
                v-model:open="linkPickerOpen"
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
            <template #callout>
              <UTooltip text="Encadré (callout)">
                <UButton
                  icon="i-lucide-message-square-warning"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="editor.chain().focus().setCallout({ type: 'info' }).run()"
                />
              </UTooltip>
            </template>
            <template #grid>
              <UTooltip text="Grille (colonnes)">
                <UButton
                  icon="i-lucide-layout-grid"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="editor.chain().focus().setGrid({ cols: 2 }).run()"
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
            aria-label="Aperçu"
            @click="preview = true"
          >
            <span class="hidden sm:inline">Aperçu</span>
          </UButton>
          <UButton
            v-else
            class="ml-auto shrink-0"
            size="xs"
            color="primary"
            variant="soft"
            icon="i-lucide-pencil"
            aria-label="Modifier"
            @click="preview = false"
          >
            <span class="hidden sm:inline">Modifier</span>
          </UButton>
        </div>

        <UEditorToolbar
          v-if="!preview"
          :editor="editor"
          :items="bubbleToolbarItems"
          layout="bubble"
          :should-show="textBubbleShouldShow"
        />

        <UEditorToolbar
          v-if="!preview"
          :editor="editor"
          :items="imageBubbleItems(editor)"
          layout="bubble"
          :should-show="imageBubbleShouldShow"
        />
      </UEditor>

      <ContentEditorAiReviewPanel
        v-if="aiReview && !preview"
        :review="aiReview"
        :busy="aiLoading"
        @accept="acceptReview"
        @refuse="refuseReview"
        @redo="redoReview"
        @update:active-variant="setActiveVariant"
        @update:proofread-decision="setProofreadDecision"
      />

      <ContentEditorImageSettings
        v-model:open="imageSettingsOpen"
        :editor="activeEditor"
      />

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
