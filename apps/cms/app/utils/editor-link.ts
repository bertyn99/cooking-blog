import type { Editor } from '@tiptap/vue-3'

export interface EditorLinkPayload {
  href: string
  title?: string
}

export function applyEditorLink(editor: Editor, payload: EditorLinkPayload) {
  const href = payload.href.trim()
  if (!href) {
    return
  }

  const { empty } = editor.state.selection
  const hasCode = editor.isActive('code')
  const onLink = editor.isActive('link')

  let chain = editor.chain().focus()

  if (onLink) {
    chain = chain.extendMarkRange('link').setLink({ href })
  }
  else if (hasCode && !empty) {
    chain = chain.extendMarkRange('code').setLink({ href })
  }
  else if (!empty) {
    chain = chain.setLink({ href })
  }
  else {
    const label = payload.title?.trim() || href
    chain = chain.insertContent({
      type: 'text',
      text: label,
      marks: [{ type: 'link', attrs: { href } }],
    })
  }

  chain.run()
}

export function removeEditorLink(editor: Editor) {
  editor
    .chain()
    .focus()
    .extendMarkRange('link')
    .unsetLink()
    .setMeta('preventAutolink', true)
    .run()
}
