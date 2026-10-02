import { addComponent, addComponentsDir, createResolver, defineNuxtModule } from 'nuxt/kit'

export type ContentBlockSurface = 'client' | 'editor' | 'simple'

export interface ModuleOptions {
  /**
   * Which views to auto-import.
   * Web: `['client']`. CMS: `['client', 'editor', 'simple']`.
   * Editors require `@nuxt/ui` in the host app.
   */
  surfaces: ContentBlockSurface[]
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
  },
  moduleDependencies: {
    '@nuxt/ui': {},
  },
  async setup(options) {
    const { resolve } = createResolver(import.meta.url)
    const surfaces = new Set(options.surfaces)

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
