import { joinURL } from 'ufo'
// @nuxt/image 2.x: the `#image` specifier was removed — helpers come from the
// package's public `./runtime` export instead.
import { createOperationsGenerator, defineProvider } from '@nuxt/image/runtime'
import { toPublicMediaKey } from '#shared/media-public-path'

/**
 * Nuxt Image provider → IPX modifier URLs handled by CMS jSquash (`/images/w_800,f_webp/…`).
 * Only modifiers implemented on the CMS are emitted.
 * @see https://github.com/unjs/ipx
 */
const operationsGenerator = createOperationsGenerator({
  keyMap: {
    width: 'w',
    height: 'h',
    resize: 's',
    fit: 'fit',
    format: 'f',
    quality: 'q',
    enlarge: 'enlarge',
  },
  joinWith: ',',
  formatter: (key: string, value: string) => {
    if (key === 'enlarge' && (value === '' || value === 'true')) {
      return 'enlarge'
    }
    return `${key}_${value}`
  },
})

export default defineProvider<{ baseURL?: string }>({
  getImage(src, { modifiers, baseURL = '/images/' }) {
    const operations = operationsGenerator(modifiers)
    const publicKey = toPublicMediaKey(src)

    if (!operations) {
      return { url: joinURL(baseURL, publicKey) }
    }

    return {
      url: joinURL(baseURL, operations, publicKey),
    }
  },
})
