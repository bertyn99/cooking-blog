export const EDITOR_PAGE_DEFAULT_VIEW_KEY = 'editor.pageDefaultView'
export { AMAZON_AFFILIATE_TAG_KEY } from './glossary-affiliate'

export type PageEditorDefaultView = 'editor' | 'simple'

export function parsePageEditorDefaultView(value: unknown): PageEditorDefaultView {
  return value === 'simple' ? 'simple' : 'editor'
}

export function parseAmazonAffiliateTag(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim()
}
