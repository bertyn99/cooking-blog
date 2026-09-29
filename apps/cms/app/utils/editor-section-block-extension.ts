import { mergeAttributes, Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import {
  catalogEntryForTag,
  type SectionBlockTag,
} from '#shared/content-blocks/catalog'
import SectionBlockNodeView from '~/components/content/editor/SectionBlockNodeView.vue'
import { createMdcContainerMarkdownSpec } from '~/utils/editor-mdc-container'

const NODE_NAME_BY_TAG: Record<SectionBlockTag, string> = {
  hero: 'hero',
  newsletter: 'newsletter',
  'recipe-list': 'recipeList',
  'article-list': 'articleList',
}

function createSectionBlockExtension(tag: SectionBlockTag) {
  const def = catalogEntryForTag(tag)
  const nodeName = NODE_NAME_BY_TAG[tag]
  const markdown = createMdcContainerMarkdownSpec({
    nodeName,
    name: tag,
    content: 'none',
    allowedAttributes: def.allowedProps,
    defaultAttributes: def.defaultProps,
  })

  return Node.create({
    name: nodeName,
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,
    defining: true,

    addOptions() {
      return {
        tag,
        label: def.label,
        icon: def.icon,
        allowedProps: def.allowedProps,
      }
    },

    addAttributes() {
      const attributes: Record<string, {
        default: string | number | boolean | null
        parseHTML: (element: HTMLElement) => string | null
        renderHTML: (attributes: Record<string, unknown>) => Record<string, string>
      }> = {}

      for (const key of def.allowedProps) {
        const fallback = def.defaultProps[key]
        attributes[key] = {
          default: fallback ?? null,
          parseHTML: element => element.getAttribute(`data-${key}`),
          renderHTML: (attrs) => {
            const value = attrs[key]
            if (value == null || value === '') return {}
            return { [`data-${key}`]: String(value) }
          },
        }
      }

      return attributes
    },

    parseHTML() {
      return [{ tag: `div[data-type="${tag}"]` }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'div',
        mergeAttributes({ 'data-type': tag }, HTMLAttributes),
      ]
    },

    addNodeView() {
      return VueNodeViewRenderer(SectionBlockNodeView)
    },

    parseMarkdown: markdown.parseMarkdown,
    markdownTokenizer: markdown.markdownTokenizer,
    renderMarkdown: markdown.renderMarkdown,
  })
}

export const ContentHero = createSectionBlockExtension('hero')
export const ContentNewsletter = createSectionBlockExtension('newsletter')
export const ContentRecipeList = createSectionBlockExtension('recipe-list')
export const ContentArticleList = createSectionBlockExtension('article-list')

export const pageSectionExtensions = [
  ContentHero,
  ContentNewsletter,
  ContentRecipeList,
  ContentArticleList,
]
