import type { Component } from 'vue'

const PROSE_TAGS = ['callout', 'grid', 'image'] as const

function kebabFromClientPath(path: string): string | null {
  const match = path.match(/\/blocks\/([^/]+)\/Client\.vue$/)
  return match?.[1] ?? null
}

function register(
  components: Record<string, Component>,
  kebab: string,
  component: Component,
) {
  components[kebab] = component
  const pascal = kebab
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  components[pascal] = component
}

/**
 * Comark MDX map: `::hero` → `blocks/hero/Client.vue`.
 * Native images also bind `img` → Image Client.
 */
export function buildContentBlockClients(): Record<string, Component> {
  const modules = import.meta.glob<{ default: Component }>(
    '../../blocks/*/Client.vue',
    { eager: true },
  )

  const components: Record<string, Component> = {}

  for (const [path, mod] of Object.entries(modules)) {
    const kebab = kebabFromClientPath(path)
    if (!kebab || !mod.default) continue
    register(components, kebab, mod.default)
  }

  if (components.image) {
    components.img = components.image
  }

  return components
}

/** Callout + grid (+ img) for article/recipe markdown — no page sections. */
export function buildProseBlockClients(): Record<string, Component> {
  const all = buildContentBlockClients()
  const components: Record<string, Component> = {}
  for (const tag of PROSE_TAGS) {
    const component = all[tag]
    if (!component) continue
    register(components, tag, component)
  }
  if (all.image) {
    components.img = all.image
  }
  return components
}

function kebabFromSimplePath(path: string): string | null {
  const match = path.match(/\/blocks\/([^/]+)\/Simple\.vue$/)
  return match?.[1] ?? null
}

/** Canvas Vue simple map: `hero` → `blocks/hero/Simple.vue`. */
export function buildContentBlockSimples(): Record<string, Component> {
  const modules = import.meta.glob<{ default: Component }>(
    '../../blocks/*/Simple.vue',
    { eager: true },
  )

  const components: Record<string, Component> = {}

  for (const [path, mod] of Object.entries(modules)) {
    const kebab = kebabFromSimplePath(path)
    if (!kebab || !mod.default) continue
    components[kebab] = mod.default
  }

  return components
}

export {
  JdcMediaPickerKey,
  type JdcMediaPickCurrent,
  type JdcMediaPickResult,
  type JdcMediaPickerApi,
} from './jdc-media-picker'
