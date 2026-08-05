import { Extension } from '@tiptap/core'
import type { JSONContent } from '@tiptap/core'
import type { Editor } from '@tiptap/vue-3'
import { useCompletion } from '@ai-sdk/vue'
import { getApiErrorMessage } from '#shared/api-error'
import {
  type EditorCompletionMode,
  type EditorTransformMode,
  type ProofreadCorrection,
} from '#shared/editor-completion-modes'
import type { AiReviewAnchor, AiReviewKind, AiReviewPanelModel } from '~/types/editor-ai-review'
import {
  AiReviewHighlightExtension,
  aiReviewHighlightUpdateMeta,
  type AiReviewHighlightRange,
  type AiReviewHighlightStorage,
} from '~/utils/editor-ai-review-extension'
import {
  EditorCompletionExtension,
  type CompletionStorage,
  completionUpdateMetaKey,
} from '~/utils/editor-completion-extension'
import { sanitizeProofreadCorrections } from '~/utils/editor-proofread-map'

export interface UseEditorCompletionOptions {
  api?: string
  proofreadApi?: string
}

type EditorHostRef = Ref<{ editor: Editor | undefined } | null | undefined>
type ProofreadDecision = 'pending' | 'accept' | 'reject'

interface ReviewSession {
  kind: AiReviewKind
  mode: EditorCompletionMode
  language?: string
  range: { from: number, to: number }
  original: string
  prompt: string
  variants: string[]
  activeVariant: number
  status: 'streaming' | 'ready' | 'error'
  proofread: Array<ProofreadCorrection & { decision: ProofreadDecision }>
  abort?: AbortController
}

const editorCompletionServerStub = Extension.create({ name: 'completion-ssr-stub' })

function createServerStub() {
  return {
    extension: editorCompletionServerStub,
    highlightExtension: editorCompletionServerStub,
    handlers: {},
    isLoading: computed(() => false),
    mode: ref<EditorCompletionMode>('continue'),
    review: computed(() => null as AiReviewPanelModel | null),
    stop: () => {},
    acceptReview: () => {},
    refuseReview: () => {},
    redoReview: () => {},
    setActiveVariant: (_index: number) => {},
    setProofreadDecision: (_id: string, _decision: ProofreadDecision) => {},
  }
}

async function streamCompletionText(options: {
  api: string
  prompt: string
  mode: EditorCompletionMode
  language?: string
  signal?: AbortSignal
  onChunk: (text: string) => void
}): Promise<string> {
  const response = await fetch(options.api, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    signal: options.signal,
    body: JSON.stringify({
      prompt: options.prompt,
      mode: options.mode,
      ...(options.language ? { language: options.language } : {}),
    }),
  })

  if (!response.ok) {
    let message = `Erreur ${response.status}`
    try {
      const payload = await response.json() as { message?: string, statusMessage?: string }
      message = payload.message || payload.statusMessage || message
    }
    catch {
      // keep status message
    }
    throw new Error(message)
  }

  if (!response.body) {
    const text = await response.text()
    if (options.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
    options.onChunk(text)
    return text
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let full = ''

  try {
    while (true) {
      if (options.signal?.aborted) {
        await reader.cancel().catch(() => {})
        throw new DOMException('Aborted', 'AbortError')
      }

      const { done, value } = await reader.read()
      if (done) {
        break
      }
      full += decoder.decode(value, { stream: true })
      options.onChunk(full)
    }

    full += decoder.decode()
    options.onChunk(full)
    return full
  }
  catch (error) {
    await reader.cancel().catch(() => {})
    throw error
  }
}

function applyProofreadDecisions(
  original: string,
  items: Array<ProofreadCorrection & { decision: ProofreadDecision }>,
): string {
  // Opt-out: apply pending + accepted; only Ignorer skips a suggestion.
  const toApply = items
    .filter(item => item.decision !== 'reject')
    .slice()
    .sort((a, b) => b.start - a.start)

  let next = original
  for (const item of toApply) {
    next = `${next.slice(0, item.start)}${item.suggestion}${next.slice(item.end)}`
  }
  return next
}

/** Insert plain review text without markdown parsing (`*`, `_`, `#` stay literal). */
function plainReviewTextToDocContent(text: string): JSONContent[] {
  return text.split('\n').map(line => ({
    type: 'paragraph',
    content: line ? [{ type: 'text', text: line }] : [],
  }))
}

/**
 * AI completion for UEditor with review UX:
 * stream → compare (old rose / new green) → Accept / Refuse / Relancer.
 * Reformulation offers 2 variants; Orthographe lists per-error decisions.
 */
export function useEditorCompletion(
  editorRef: EditorHostRef,
  options: UseEditorCompletionOptions = {},
) {
  if (import.meta.server) {
    return createServerStub()
  }

  const toast = useToast()
  const api = options.api || '/api/completion'
  const proofreadApi = options.proofreadApi || '/api/proofread'

  const activeEditor = shallowRef<Editor | null>(null)
  const mode = ref<EditorCompletionMode>('continue')
  const language = ref<string>()
  const session = ref<ReviewSession | null>(null)
  const busy = ref(false)

  function resolveEditor(): Editor | undefined {
    return activeEditor.value
      ?? editorRef.value?.editor
      ?? undefined
  }

  function getCompletionStorage() {
    const editor = resolveEditor()
    const storage = editor?.storage as Record<string, CompletionStorage> | undefined
    return storage?.completion
  }

  function getHighlightStorage() {
    const editor = resolveEditor()
    const storage = editor?.storage as Record<string, AiReviewHighlightStorage> | undefined
    return storage?.aiReviewHighlight
  }

  function refreshHighlights(ranges: AiReviewHighlightRange[]) {
    const editor = resolveEditor()
    const storage = getHighlightStorage()
    if (!editor || !storage) {
      return
    }
    storage.setRanges(ranges)
    editor.view.dispatch(editor.state.tr.setMeta(aiReviewHighlightUpdateMeta, true))
  }

  function clearHighlights() {
    refreshHighlights([])
  }

  function paintSessionHighlights(current: ReviewSession) {
    switch (current.kind) {
      case 'continue':
      case 'proofread':
        // No in-doc lint underlines for orthographe — floating panel only.
        clearHighlights()
        return
      case 'reformulate':
        refreshHighlights([{ from: current.range.from, to: current.range.to, kind: 'old' }])
        return
      default: {
        const _exhaustive: never = current.kind
        return _exhaustive
      }
    }
  }

  function measureReviewAnchor(): AiReviewAnchor | null {
    const editor = resolveEditor()
    const current = session.value
    if (!editor || !current) {
      return null
    }

    try {
      const docSize = editor.state.doc.content.size
      const { from, to } = current.range
      const safeFrom = Math.max(0, Math.min(from, docSize))
      const endPos = Math.max(
        safeFrom,
        Math.min(to, docSize) - (to > safeFrom ? 1 : 0),
      )
      const start = editor.view.coordsAtPos(safeFrom)
      const end = editor.view.coordsAtPos(endPos)

      const host = editor.view.dom.closest('.cms-markdown-editor') as HTMLElement | null
      const box = (host ?? editor.view.dom).getBoundingClientRect()
      const pad = 8

      return {
        top: Math.min(start.top, end.top),
        bottom: Math.max(start.bottom, end.bottom),
        left: box.left + pad,
        right: box.right - pad,
      }
    }
    catch {
      return null
    }
  }

  const reviewAnchorTick = ref(0)
  function bumpReviewAnchor() {
    reviewAnchorTick.value += 1
  }

  if (import.meta.client) {
    useEventListener(window, 'scroll', bumpReviewAnchor, true)
    useEventListener(window, 'resize', bumpReviewAnchor)
  }

  watch(
    () => session.value
      ? [
          session.value.range.from,
          session.value.range.to,
          session.value.status,
          session.value.kind,
        ]
      : null,
    () => {
      bumpReviewAnchor()
    },
  )

  const review = computed<AiReviewPanelModel | null>(() => {
    const current = session.value
    if (!current) {
      return null
    }
    // Depend on tick so scroll/resize recompute coords.
    void reviewAnchorTick.value
    return {
      kind: current.kind,
      mode: current.mode,
      original: current.original,
      variants: current.variants,
      activeVariant: current.activeVariant,
      status: current.status,
      proofread: current.proofread,
      anchor: measureReviewAnchor(),
    }
  })

  const {
    completion: ghostCompletion,
    complete: ghostComplete,
    isLoading: ghostLoading,
    stop: stopGhost,
    setCompletion: setGhostCompletion,
  } = useCompletion({
    api,
    streamProtocol: 'text',
    credentials: 'same-origin',
    body: computed(() => ({ mode: 'continue' as const })),
    onError: (error) => {
      getCompletionStorage()?.clearSuggestion()
      setGhostCompletion('')
      toast.add({
        title: 'Assistance IA indisponible',
        description: getApiErrorMessage(error, 'La génération a échoué. Réessayez.'),
        color: 'error',
      })
    },
  })

  const isLoading = computed(() => busy.value || ghostLoading.value)

  function abortSession() {
    const controller = session.value?.abort
    if (session.value) {
      session.value.abort = undefined
    }
    // Abort after detaching so in-flight onChunk handlers no-op immediately.
    controller?.abort()
  }

  function clearHighlightsDeferred() {
    // Highlight teardown can be costly on large selections — keep refuse snappy.
    const run = () => {
      try {
        clearHighlights()
      }
      catch {
        // Editor may already be destroyed.
      }
    }
    if (import.meta.client) {
      requestAnimationFrame(run)
    }
    else {
      run()
    }
  }

  function clearReview() {
    // Drop the panel first so Refuser feels instant, then abort + clean decorations.
    const controller = session.value?.abort
    if (session.value) {
      session.value.abort = undefined
    }
    session.value = null
    busy.value = false
    controller?.abort()
    clearHighlightsDeferred()
  }

  function clearClientCompletion() {
    clearReview()
    getCompletionStorage()?.clearSuggestion()
    setGhostCompletion('')
  }

  onScopeDispose(() => {
    stopGhost()
    clearClientCompletion()
  })

  watch(ghostCompletion, (newCompletion) => {
    const editor = resolveEditor()
    const storage = getCompletionStorage()
    if (!editor || !storage?.visible || !newCompletion) {
      return
    }

    let suggestionText = newCompletion
    if (storage.position !== undefined) {
      const textBefore = editor.state.doc.textBetween(Math.max(0, storage.position - 1), storage.position)
      if (textBefore && !/\s/.test(textBefore) && !suggestionText.startsWith(' ')) {
        suggestionText = ` ${suggestionText}`
      }
    }
    storage.setSuggestion(suggestionText)
    editor.view.dispatch(editor.state.tr.setMeta(completionUpdateMetaKey, true))
  })

  function getMarkdownBefore(editor: Editor, pos: number): string {
    const { state } = editor
    const serializer = (editor.storage.markdown as { serializer?: { serialize: (content: unknown) => string } })?.serializer
    if (serializer) {
      const slice = state.doc.slice(0, pos)
      return serializer.serialize(slice.content)
    }
    return state.doc.textBetween(0, pos, '\n')
  }

  async function runContinueSession(current: ReviewSession) {
    busy.value = true
    current.status = 'streaming'
    current.variants = ['']
    current.activeVariant = 0
    const abort = new AbortController()
    current.abort = abort
    session.value = { ...current }

    try {
      await streamCompletionText({
        api,
        prompt: current.prompt,
        mode: 'continue',
        signal: abort.signal,
        onChunk: (text) => {
          if (!session.value || session.value.abort !== abort) {
            return
          }
          session.value = {
            ...session.value,
            variants: [text],
            status: 'streaming',
          }
        },
      })
      if (session.value?.abort === abort) {
        session.value = {
          ...session.value,
          status: session.value.variants[0]?.trim() ? 'ready' : 'error',
        }
      }
    }
    catch (error) {
      if (abort.signal.aborted) {
        return
      }
      toast.add({
        title: 'Assistance IA',
        description: getApiErrorMessage(error, 'La génération a échoué.'),
        color: 'error',
      })
      if (session.value?.abort === abort) {
        session.value = { ...session.value, status: 'error' }
      }
    }
    finally {
      if (session.value?.abort === abort) {
        busy.value = false
      }
    }
  }

  async function runReformulateSession(current: ReviewSession) {
    busy.value = true
    current.status = 'streaming'
    current.variants = ['', '']
    current.activeVariant = 0
    const abort = new AbortController()
    current.abort = abort
    session.value = { ...current }
    paintSessionHighlights(current)

    const variantBuffers = ['', '']

    try {
      await Promise.all([0, 1].map(async (index) => {
        await streamCompletionText({
          api,
          prompt: current.prompt,
          mode: current.mode,
          language: current.language,
          signal: abort.signal,
          onChunk: (text) => {
            if (!session.value || session.value.abort !== abort) {
              return
            }
            variantBuffers[index] = text
            session.value = {
              ...session.value,
              variants: [...variantBuffers],
              status: 'streaming',
            }
          },
        })
      }))

      if (session.value?.abort === abort) {
        const hasText = session.value.variants.some(v => v.trim())
        session.value = {
          ...session.value,
          status: hasText ? 'ready' : 'error',
        }
      }
    }
    catch (error) {
      if (abort.signal.aborted) {
        return
      }
      toast.add({
        title: 'Assistance IA',
        description: getApiErrorMessage(error, 'La génération a échoué.'),
        color: 'error',
      })
      if (session.value?.abort === abort) {
        session.value = { ...session.value, status: 'error' }
      }
    }
    finally {
      if (session.value?.abort === abort) {
        busy.value = false
      }
    }
  }

  async function runProofreadSession(current: ReviewSession) {
    busy.value = true
    current.status = 'streaming'
    current.proofread = []
    const abort = new AbortController()
    current.abort = abort
    session.value = { ...current }
    paintSessionHighlights(current)

    try {
      const payload = await $fetch<{ corrections: ProofreadCorrection[] }>(proofreadApi, {
        method: 'POST',
        body: { text: current.original },
        signal: abort.signal,
      })

      if (session.value?.abort !== abort) {
        return
      }

      const proofread = sanitizeProofreadCorrections(
        current.original,
        payload.corrections || [],
      ).map(item => ({
        ...item,
        decision: 'pending' as const,
      }))

      if (!proofread.length) {
        toast.add({
          title: 'Orthographe',
          description: 'Aucune faute détectée en français.',
          color: 'success',
        })
        busy.value = false
        clearReview()
        return
      }

      session.value = {
        ...session.value,
        proofread,
        status: 'ready',
        variants: [],
      }
      paintSessionHighlights(session.value)
    }
    catch (error) {
      if (abort.signal.aborted) {
        return
      }
      toast.add({
        title: 'Orthographe',
        description: getApiErrorMessage(error, 'L’analyse a échoué.'),
        color: 'error',
      })
      if (session.value?.abort === abort) {
        session.value = { ...session.value, status: 'error' }
      }
    }
    finally {
      if (session.value?.abort === abort) {
        busy.value = false
      }
    }
  }

  function startReviewSession(next: Omit<ReviewSession, 'variants' | 'activeVariant' | 'status' | 'proofread' | 'abort'> & {
    kind: AiReviewKind
  }) {
    abortSession()
    getCompletionStorage()?.clearSuggestion()
    setGhostCompletion('')

    const base: ReviewSession = {
      ...next,
      variants: next.kind === 'reformulate' ? ['', ''] : [''],
      activeVariant: 0,
      status: 'streaming',
      proofread: [],
    }

    mode.value = next.mode
    language.value = next.language
    session.value = base

    if (next.kind === 'continue') {
      void runContinueSession(base)
      return
    }
    if (next.kind === 'proofread') {
      void runProofreadSession(base)
      return
    }
    void runReformulateSession(base)
  }

  function triggerContinue(editor: Editor) {
    if (isLoading.value) {
      return
    }
    activeEditor.value = editor
    const { selection } = editor.state
    let pos = selection.empty ? selection.from : selection.to
    // Toolbar click often leaves the caret at doc start — continue from end of content.
    if (pos <= 1 || !getMarkdownBefore(editor, pos).trim()) {
      pos = Math.max(1, editor.state.doc.content.size - 1)
    }
    const prompt = getMarkdownBefore(editor, pos)
    startReviewSession({
      kind: 'continue',
      mode: 'continue',
      range: { from: pos, to: pos },
      original: prompt,
      prompt,
    })
  }

  function triggerTransform(editor: Editor, transformMode: EditorTransformMode, lang?: string) {
    if (isLoading.value) {
      return
    }

    activeEditor.value = editor
    const { selection } = editor.state
    if (selection.empty) {
      return
    }

    const selectedText = stateTextBetween(editor, selection.from, selection.to)

    if (transformMode === 'fix') {
      startReviewSession({
        kind: 'proofread',
        mode: 'fix',
        range: { from: selection.from, to: selection.to },
        original: selectedText,
        prompt: selectedText,
      })
      return
    }

    startReviewSession({
      kind: 'reformulate',
      mode: transformMode,
      language: lang,
      range: { from: selection.from, to: selection.to },
      original: selectedText,
      prompt: selectedText,
    })
  }

  function stateTextBetween(editor: Editor, from: number, to: number) {
    return editor.state.doc.textBetween(from, to, '\n')
  }

  function reviewRangeStillValid(editor: Editor, from: number, to: number, expected: string): boolean {
    const docSize = editor.state.doc.content.size
    if (from < 0 || to > docSize || from > to) {
      return false
    }
    return stateTextBetween(editor, from, to) === expected
  }

  function acceptReview() {
    const current = session.value
    const editor = resolveEditor()
    if (!current || !editor || current.status === 'streaming') {
      return
    }

    if (current.kind === 'continue') {
      const text = current.variants[0]?.trim()
      if (!text) {
        return
      }
      const docSize = editor.state.doc.content.size
      if (current.range.from < 0 || current.range.from > docSize) {
        toast.add({
          title: 'Assistance IA',
          description: 'Le document a changé. Relancez la génération.',
          color: 'warning',
        })
        return
      }
      let insert = text
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, current.range.from - 1),
        current.range.from,
      )
      if (textBefore && !/\s/.test(textBefore) && !insert.startsWith(' ')) {
        insert = ` ${insert}`
      }
      editor.chain().focus().insertContentAt(current.range.from, insert).run()
      clearReview()
      return
    }

    if (current.kind === 'reformulate') {
      const text = current.variants[current.activeVariant]?.trim()
      if (!text) {
        return
      }
      if (!reviewRangeStillValid(editor, current.range.from, current.range.to, current.original)) {
        toast.add({
          title: 'Assistance IA',
          description: 'La sélection a changé. Relancez la reformulation.',
          color: 'warning',
        })
        return
      }
      editor.chain()
        .focus()
        .deleteRange({ from: current.range.from, to: current.range.to })
        .insertContentAt(current.range.from, text, { contentType: 'markdown' })
        .run()
      clearReview()
      return
    }

    const nextText = applyProofreadDecisions(current.original, current.proofread)
    if (nextText === current.original) {
      // Nothing to apply (no errors, or all ignored) — just close the review.
      clearReview()
      return
    }

    if (!reviewRangeStillValid(editor, current.range.from, current.range.to, current.original)) {
      toast.add({
        title: 'Orthographe',
        description: 'La sélection a changé. Relancez l’analyse.',
        color: 'warning',
      })
      return
    }

    editor.chain()
      .focus()
      .deleteRange({ from: current.range.from, to: current.range.to })
      .insertContentAt(current.range.from, plainReviewTextToDocContent(nextText))
      .run()
    clearReview()
  }

  function refuseReview() {
    clearReview()
  }

  function redoReview() {
    const current = session.value
    if (!current || busy.value) {
      return
    }
    startReviewSession({
      kind: current.kind,
      mode: current.mode,
      language: current.language,
      range: current.range,
      original: current.original,
      prompt: current.prompt,
    })
  }

  function setActiveVariant(index: number) {
    if (!session.value || index < 0 || index >= session.value.variants.length) {
      return
    }
    session.value = { ...session.value, activeVariant: index }
  }

  function setProofreadDecision(id: string, decision: ProofreadDecision) {
    if (!session.value) {
      return
    }
    session.value = {
      ...session.value,
      proofread: session.value.proofread.map(item =>
        item.id === id ? { ...item, decision } : item,
      ),
    }
    paintSessionHighlights(session.value)
  }

  const extension = EditorCompletionExtension.configure({
    onTrigger: (editor) => {
      if (isLoading.value || session.value) {
        return false
      }
      activeEditor.value = editor
      mode.value = 'continue'
      language.value = undefined
      void ghostComplete(getMarkdownBefore(editor, editor.state.selection.from))
      return true
    },
    onAccept: () => {
      setGhostCompletion('')
    },
    onDismiss: () => {
      if (session.value) {
        return
      }
      stopGhost()
      setGhostCompletion('')
    },
  })

  const highlightExtension = AiReviewHighlightExtension

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
    highlightExtension,
    handlers,
    isLoading,
    mode,
    review,
    stop: () => {
      stopGhost()
      abortSession()
      busy.value = false
    },
    acceptReview,
    refuseReview,
    redoReview,
    setActiveVariant,
    setProofreadDecision,
  }
}
