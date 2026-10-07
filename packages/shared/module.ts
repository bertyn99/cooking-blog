import { addComponent, addComponentsDir, createResolver, defineNuxtModule } from 'nuxt/kit'

export type ContentBlockSurface = 'client' | 'editor' | 'simple'

export interface ModuleOptions {
  /**
   * Which views to auto-import.
   * Web: `['client']`. CMS: `['client', 'editor', 'simple']`.
   * Editors require `@nuxt/ui` in the host app.
   */
  surfaces: ContentBlockSurface[]
  /**
   * Project theme — the JDC brand applied to every host app.
   * Per-app `app.config.ts` (`ui.colors`) still wins over these defaults.
   */
  theme?: {
    primary?: string
    neutral?: string
  }
}

const SURFACE_FILES: Record<ContentBlockSurface, string> = {
  client: '**/Client.vue',
  editor: '**/Editor.vue',
  simple: '**/Simple.vue',
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@journalducuistot/shared',
    configKey: 'jdcContent',
    compatibility: {
      nuxt: '>=4.0.0',
    },
  },
  defaults: {
    surfaces: ['client'],
    theme: {
      primary: 'orange',
      neutral: 'stone',
    },
  },
  moduleDependencies: {
    '@nuxt/ui': {},
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const surfaces = new Set(options.surfaces)

    // Project theme: primary + neutral as app-config defaults. @nuxt/ui
    // merges `nuxt.options.appConfig.ui` over its own defaults, and the
    // host app's app.config.ts wins over us — so this fixes the JDC brand
    // everywhere while keeping per-app overrides possible.
    const theme = { primary: options.theme?.primary ?? 'orange', neutral: options.theme?.neutral ?? 'stone' }
    const appConfigUi = (nuxt.options.appConfig.ui ??= {}) as { colors?: Record<string, string> }
    appConfigUi.colors = { ...theme, ...appConfigUi.colors }

    // Shared brand CSS (fonts, .jdc-public isolation) — unshifted so host
    // app styles can override.
    nuxt.options.css.unshift(resolve('./app/assets/css/jdc-theme.css'))

    const ignore: string[] = []
    for (const surface of ['client', 'editor', 'simple'] as const) {
      if (!surfaces.has(surface)) {
        ignore.push(SURFACE_FILES[surface])
      }
    }

    await addComponentsDir({
      path: resolve('./blocks'),
      prefix: 'Block',
      pathPrefix: true,
      global: false,
      ignore,
    })

    if (surfaces.has('simple')) {
      addComponent({
        name: 'BlockSimpleChrome',
        filePath: resolve('./app/components/BlockSimpleChrome.vue'),
      })
    }

    if (surfaces.has('editor') || surfaces.has('simple')) {
      addComponent({
        name: 'BlockPropBadges',
        filePath: resolve('./app/components/BlockPropBadges.vue'),
      })
      addComponent({
        name: 'BlockPropsForm',
        filePath: resolve('./app/components/BlockPropsForm.vue'),
      })
      addComponent({
        name: 'BlockMediaField',
        filePath: resolve('./app/components/BlockMediaField.vue'),
      })
    }
  },
})

declare module '@nuxt/schema' {
  interface NuxtConfig {
    jdcContent?: Partial<ModuleOptions>
  }
  interface NuxtOptions {
    jdcContent?: ModuleOptions
  }
}
