import { useCompletion } from '@ai-sdk/vue'
import type { Editor } from '@tiptap/vue-3'
import {
  EditorCompletionExtension,
  type CompletionStorage,
} from '~/utils/editor-completion-extension'

type CompletionMode = 'continue' | 'fix' | 'extend' | 'reduce' | 'simplify' | 'summarize' | 'translate'

export interface UseEditorCompletionOptions {
  api?: string
}

type EditorHostRef = Ref<{ editor: Editor | undefined } | null | undefined>

export function useEditorCompletion(
  editorRef: EditorHostRef,
  options: UseEditorCompletionOptions = {},
) {
  const insertState = ref<{
    pos: number
    deleteRange?: { from: number, to: number }
  }>()
  const mode = ref<CompletionMode>('continue')
  const language = ref<string>()

  function getCompletionStorage() {
    const storage = editorRef.value?.editor?.storage as Record<string, CompletionStorage> | undefined
    return storage?.completion
  }

  const { completion, complete, isLoading, stop, setCompletion } = useCompletion({
    api: options.api || '/api/completion',
    streamProtocol: 'text',
    body: computed(() => ({
      mode: mode.value,
      language: language.value,
    })),
    onFinish: (_prompt, completionText) => {
      const storage = getCompletionStorage()
      if (mode.value === 'continue' && storage?.visible) {
        return
      }

      const transformModes = ['fix', 'extend', 'reduce', 'simplify', 'summarize', 'translate']
      if (transformModes.includes(mode.value) && insertState.value && completionText) {
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
    onError: () => {
      insertState.value = undefined
      getCompletionStorage()?.clearSuggestion()
    },
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
      editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))
    }
    else if (insertState.value) {
      const transformModes = ['fix', 'extend', 'reduce', 'simplify', 'summarize', 'translate']
      if (transformModes.includes(mode.value)) {
        return
      }

      if (insertState.value.deleteRange && !oldCompletion) {
        editor.chain()
          .focus()
          .deleteRange(insertState.value.deleteRange)
          .run()
        insertState.value.deleteRange = undefined
      }

      let delta = newCompletion.slice(oldCompletion?.length || 0)
      if (delta) {
        if (['fix', 'simplify', 'translate'].includes(mode.value)) {
          delta = delta.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ')
        }

        if (mode.value === 'continue' && !oldCompletion) {
          const textBefore = editor.state.doc.textBetween(
            Math.max(0, insertState.value.pos - 1),
            insertState.value.pos,
          )
          if (textBefore && !/\s/.test(textBefore)) {
            delta = ` ${delta}`
          }
        }

        editor.chain().focus().command(({ tr }) => {
          tr.insertText(delta, insertState.value!.pos)
          return true
        }).run()
        insertState.value.pos += delta.length
      }
    }
  })

  function triggerTransform(editor: Editor, transformMode: Exclude<CompletionMode, 'continue'>, lang?: string) {
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
    complete(selectedText)
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

  function triggerContinue(editor: Editor) {
    if (isLoading.value) {
      return
    }

    mode.value = 'continue'
    getCompletionStorage()?.clearSuggestion()
    const { state } = editor
    const { selection } = state

    if (selection.empty) {
      const textBefore = getMarkdownBefore(editor, selection.from)
      insertState.value = { pos: selection.from }
      complete(textBefore)
    }
    else {
      const textBefore = getMarkdownBefore(editor, selection.to)
      insertState.value = { pos: selection.to }
      complete(textBefore)
    }
  }

  const extension = EditorCompletionExtension.configure({
    onTrigger: (editor) => {
      if (isLoading.value) {
        return
      }
      mode.value = 'continue'
      const textBefore = getMarkdownBefore(editor, editor.state.selection.from)
      complete(textBefore)
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
  }
}
