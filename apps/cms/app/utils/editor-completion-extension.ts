import { Extension } from '@tiptap/core'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/vue-3'
import { useDebounceFn } from '@vueuse/core'

export interface CompletionOptions {
  debounce?: number
  autoTrigger?: boolean
  triggerCharacters?: string[]
  onTrigger?: (editor: Editor) => void
  onAccept?: () => void
  onDismiss?: () => void
}

export interface CompletionStorage {
  suggestion: string
  position: number | undefined
  visible: boolean
  debouncedTrigger: ((editor: Editor) => void) | null
  setSuggestion: (text: string) => void
  clearSuggestion: () => void
}

export const completionPluginKey = new PluginKey('completion')

export const EditorCompletionExtension = Extension.create<CompletionOptions, CompletionStorage>({
  name: 'completion',

  addOptions() {
    return {
      debounce: 250,
      autoTrigger: false,
      triggerCharacters: ['/', ':', '@'],
      onTrigger: undefined,
      onAccept: undefined,
      onDismiss: undefined,
    }
  },

  addStorage() {
    return {
      suggestion: '',
      position: undefined as number | undefined,
      visible: false,
      debouncedTrigger: null as ((editor: Editor) => void) | null,
      setSuggestion(text: string) {
        this.suggestion = text
      },
      clearSuggestion() {
        this.suggestion = ''
        this.position = undefined
        this.visible = false
      },
    }
  },

  addProseMirrorPlugins() {
    const storage = this.storage

    return [
      new Plugin({
        key: completionPluginKey,
        props: {
          decorations(state) {
            if (!storage.visible || !storage.suggestion || storage.position === undefined) {
              return DecorationSet.empty
            }

            const widget = Decoration.widget(storage.position, () => {
              const span = document.createElement('span')
              span.className = 'completion-suggestion'
              span.textContent = storage.suggestion
              span.style.cssText = 'color: var(--ui-text-muted); opacity: 0.6; pointer-events: none;'
              return span
            }, { side: 1 })

            return DecorationSet.create(state.doc, [widget])
          },
        },
      }),
    ]
  },

  addKeyboardShortcuts() {
    return {
      'Mod-j': ({ editor }) => {
        if (this.storage.visible) {
          this.storage.clearSuggestion()
          this.options.onDismiss?.()
        }
        this.storage.debouncedTrigger?.(editor as Editor)
        return true
      },
      Tab: ({ editor }) => {
        if (!this.storage.visible || !this.storage.suggestion || this.storage.position === undefined) {
          return false
        }

        const suggestion = this.storage.suggestion
        const position = this.storage.position

        this.storage.clearSuggestion()
        editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))
        editor.chain().focus().insertContentAt(position, suggestion).run()
        this.options.onAccept?.()
        return true
      },
      Escape: ({ editor }) => {
        if (this.storage.visible) {
          this.storage.clearSuggestion()
          editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))
          this.options.onDismiss?.()
          return true
        }
        return false
      },
    }
  },

  onUpdate({ editor }) {
    if (this.storage.visible) {
      this.storage.clearSuggestion()
      editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))
      this.options.onDismiss?.()
    }

    if (this.options.autoTrigger) {
      this.storage.debouncedTrigger?.(editor as Editor)
    }
  },

  onSelectionUpdate({ editor }) {
    if (this.storage.visible) {
      this.storage.clearSuggestion()
      editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))
      this.options.onDismiss?.()
    }
  },

  onCreate() {
    const storage = this.storage
    const options = this.options

    this.storage.debouncedTrigger = useDebounceFn((editor: Editor) => {
      if (!options.onTrigger) {
        return
      }

      const { state } = editor
      const { selection } = state
      const { $from } = selection

      const isAtEndOfBlock = $from.parentOffset === $from.parent.content.size
      const hasContent = $from.parent.textContent.trim().length > 0
      const textContent = $from.parent.textContent

      const endsWithPunctuation = /[.!?]\s*$/.test(textContent)
      const triggerChars = options.triggerCharacters || []
      const endsWithTrigger = triggerChars.some(char => textContent.endsWith(char))

      if (!isAtEndOfBlock || !hasContent || endsWithPunctuation || endsWithTrigger) {
        return
      }

      storage.position = selection.from
      storage.visible = true
      options.onTrigger(editor)
    }, options.debounce || 250)
  },

  onDestroy() {
    this.storage.debouncedTrigger = null
  },
})
