export const EDITOR_PAGE_DEFAULT_VIEW_KEY = 'editor.pageDefaultView'

export type PageEditorDefaultView = 'editor' | 'simple'

export function parsePageEditorDefaultView(value: unknown): PageEditorDefaultView {
  return value === 'simple' ? 'simple' : 'editor'
}
