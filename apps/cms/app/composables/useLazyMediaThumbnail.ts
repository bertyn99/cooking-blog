import { mediaPickerThumbUrl, mediaThumbnailUrl } from '~/utils/media'

export type MediaLazyThumbVariant = 'thumb' | 'picker'

const VARIANT_RESOLVER: Record<MediaLazyThumbVariant, (pathname: string) => string> = {
  thumb: mediaThumbnailUrl,
  picker: mediaPickerThumbUrl,
}

export interface LazyMediaThumbnailOptions {
  variant?: MediaLazyThumbVariant
  /** Scrollport for nested overflow (e.g. modal gallery). Defaults to viewport. */
  root?: MaybeRefOrGetter<HTMLElement | null | undefined>
  rootMargin?: string
}

/**
 * Defer thumbnail requests until the tile is near the scrollport (VueUse IO).
 * Stops observing after the first intersection — thumbnails are not unloaded.
 */
export function useLazyMediaThumbnail(
  pathname: MaybeRefOrGetter<string>,
  options: LazyMediaThumbnailOptions = {},
) {
  const {
    variant = 'thumb',
    root,
    rootMargin = '120px',
  } = options

  const resolveUrl = VARIANT_RESOLVER[variant]
  const target = ref<HTMLElement | null>(null)
  const shouldLoad = ref(false)

  const { stop } = useIntersectionObserver(
    target,
    ([entry]) => {
      if (!entry?.isIntersecting || shouldLoad.value) {
        return
      }
      shouldLoad.value = true
      stop()
    },
    {
      rootMargin,
      root: root as MaybeRefOrGetter<HTMLElement | null>,
    },
  )

  const src = computed(() => {
    if (!shouldLoad.value) {
      return undefined
    }
    return resolveUrl(toValue(pathname))
  })

  return { target, src, shouldLoad }
}
