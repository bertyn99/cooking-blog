import { useCompletion } from '@ai-sdk/vue'
import { Extension } from '@tiptap/core'
import type { Editor } from '@tiptap/vue-3'
import { getApiErrorMessage } from '#shared/api-error'
import {
  isEditorTransformMode,
  type EditorCompletionMode,
  type EditorTransformMode,
} from '#shared/editor-completion-modes'
import {
  EditorCompletionExtension,
  type CompletionStorage,
  completionUpdateMetaKey,
} from '~/utils/editor-completion-extension'

export interface UseEditorCompletionOptions {
  api?: string
}

type EditorHostRef = Ref<{ editor: Editor | undefined } | null | undefined>

const editorCompletionServerStub = Extension.create({ name: 'completion-ssr-stub' })

function createServerStub() {
  return {
    extension: editorCompletionServerStub,
    handlers: {},
    isLoading: computed(() => false),
    mode: ref<EditorCompletionMode>('continue'),
    stop: () => {},
  }
}

export function useEditorCompletion(
  editorRef: EditorHostRef,
  options: UseEditorCompletionOptions = {},
) {
  // ClientOnly parent still runs this setup during SSR for the outer shell —
  // never touch @ai-sdk/vue / toast on the server.
  if (import.meta.server) {
    return createServerStub()
  }

  const toast = useToast()
  const insertState = ref<{
    pos: number
    deleteRange?: { from: number, to: number }
  }>()
  const mode = ref<EditorCompletionMode>('continue')
  const language = ref<string>()

  function getCompletionStorage() {
    const storage = editorRef.value?.editor?.storage as Record<string, CompletionStorage> | undefined
    return storage?.completion
  }

  const { completion, complete, isLoading, stop, setCompletion } = useCompletion({
    api: options.api || '/api/completion',
    streamProtocol: 'text',
    credentials: 'same-origin',
    onFinish: (_prompt, completionText) => {
      const storage = getCompletionStorage()
      // Ghost continue: keep suggestion until Tab / Escape.
      if (mode.value === 'continue' && storage?.visible) {
        return
      }

      if (isEditorTransformMode(mode.value) && insertState.value && completionText) {
        const editor = editorRef.value?.editor
        if (editor) {
          if (insertState.value.deleteRange) {
            editor.chain()
              .focus()
              .deleteRange(insertState.value.deleteRange)
              .run()
          }

          editor.chain()
            .focus()
            .insertContentAt(insertState.value.pos, completionText, { contentType: 'markdown' })
            .run()
        }
      }

      insertState.value = undefined
    },
    onError: (error) => {
      insertState.value = undefined
      getCompletionStorage()?.clearSuggestion()
      setCompletion('')
      toast.add({
        title: 'Assistance IA indisponible',
        description: getApiErrorMessage(error, 'La génération a échoué. Réessayez.'),
        color: 'error',
      })
    },
  })

  function clearClientCompletion() {
    insertState.value = undefined
    getCompletionStorage()?.clearSuggestion()
    setCompletion('')
  }

  onScopeDispose(() => {
    stop()
    clearClientCompletion()
  })

  watch(completion, (newCompletion, oldCompletion) => {
    const editor = editorRef.value?.editor
    if (!editor || !newCompletion) {
      return
    }

    const storage = getCompletionStorage()
    if (storage?.visible) {
      let suggestionText = newCompletion
      if (storage.position !== undefined) {
        const textBefore = editor.state.doc.textBetween(Math.max(0, storage.position - 1), storage.position)
        if (textBefore && !/\s/.test(textBefore) && !suggestionText.startsWith(' ')) {
          suggestionText = ` ${suggestionText}`
        }
      }
      storage.setSuggestion(suggestionText)
      editor.view.dispatch(editor.state.tr.setMeta(completionUpdateMetaKey, true))
      return
    }

    // Transform modes wait for onFinish (markdown insert). Do not stream into the doc.
    if (isEditorTransformMode(mode.value) || !insertState.value) {
      return
    }

    if (insertState.value.deleteRange && !oldCompletion) {
      editor.chain()
        .focus()
        .deleteRange(insertState.value.deleteRange)
        .run()
      insertState.value.deleteRange = undefined
    }

    const delta = newCompletion.slice(oldCompletion?.length || 0)
    if (!delta) {
      return
    }

    editor.chain().focus().command(({ tr }) => {
      tr.insertText(delta, insertState.value!.pos)
      return true
    }).run()
    insertState.value.pos += delta.length
  })

  function requestBody() {
    return {
      mode: mode.value,
      language: language.value,
    }
  }

  function triggerTransform(editor: Editor, transformMode: EditorTransformMode, lang?: string) {
    if (isLoading.value) {
      return
    }

    getCompletionStorage()?.clearSuggestion()

    const { state } = editor
    const { selection } = state

    if (selection.empty) {
      return
    }

    mode.value = transformMode
    language.value = lang
    const selectedText = state.doc.textBetween(selection.from, selection.to)

    insertState.value = { pos: selection.from, deleteRange: { from: selection.from, to: selection.to } }
    void complete(selectedText, { body: requestBody() })
  }

  function getMarkdownBefore(editor: Editor, pos: number): string {
    const { state } = editor
    const serializer = (editor.storage.markdown as { serializer?: { serialize: (content: unknown) => string } })?.serializer
    if (serializer) {
      const slice = state.doc.slice(0, pos)
      return serializer.serialize(slice.content)
    }
    return state.doc.textBetween(0, pos, '\n')
  }

  /** Ghost-text continue (toolbar + Mod-j share this path). */
  function triggerContinue(editor: Editor) {
    if (isLoading.value) {
      return
    }

    mode.value = 'continue'
    language.value = undefined
    insertState.value = undefined

    const storage = getCompletionStorage()
    storage?.clearSuggestion()

    const { selection } = editor.state
    const pos = selection.empty ? selection.from : selection.to

    if (storage) {
      storage.position = pos
      storage.visible = true
    }

    void complete(getMarkdownBefore(editor, pos), { body: requestBody() })
  }

  const extension = EditorCompletionExtension.configure({
    onTrigger: (editor) => {
      if (isLoading.value) {
        return
      }
      triggerContinue(editor)
    },
    onAccept: () => {
      setCompletion('')
    },
    onDismiss: () => {
      stop()
      setCompletion('')
    },
  })

  const handlers = {
    aiContinue: {
      canExecute: () => !isLoading.value,
      execute: (editor: Editor) => {
        triggerContinue(editor)
        return editor.chain()
      },
      isActive: () => !!(isLoading.value && mode.value === 'continue'),
      isDisabled: () => !!isLoading.value,
    },
    aiFix: {
      canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor: Editor) => {
        triggerTransform(editor, 'fix')
        return editor.chain()
      },
      isActive: () => !!(isLoading.value && mode.value === 'fix'),
      isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value,
    },
    aiExtend: {
      canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor: Editor) => {
        triggerTransform(editor, 'extend')
        return editor.chain()
      },
      isActive: () => !!(isLoading.value && mode.value === 'extend'),
      isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value,
    },
    aiReduce: {
      canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor: Editor) => {
        triggerTransform(editor, 'reduce')
        return editor.chain()
      },
      isActive: () => !!(isLoading.value && mode.value === 'reduce'),
      isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value,
    },
    aiSimplify: {
      canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor: Editor) => {
        triggerTransform(editor, 'simplify')
        return editor.chain()
      },
      isActive: () => !!(isLoading.value && mode.value === 'simplify'),
      isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value,
    },
    aiSummarize: {
      canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor: Editor) => {
        triggerTransform(editor, 'summarize')
        return editor.chain()
      },
      isActive: () => !!(isLoading.value && mode.value === 'summarize'),
      isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value,
    },
    aiTranslate: {
      canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor: Editor, cmd: { language?: string } | undefined) => {
        triggerTransform(editor, 'translate', cmd?.language)
        return editor.chain()
      },
      isActive: (_editor: Editor, cmd: { language?: string } | undefined) =>
        !!(isLoading.value && mode.value === 'translate' && language.value === cmd?.language),
      isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value,
    },
  }

  return {
    extension,
    handlers,
    isLoading,
    mode,
    stop,
  }
}
