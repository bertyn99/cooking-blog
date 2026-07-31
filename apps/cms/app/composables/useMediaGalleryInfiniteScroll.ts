import type { Ref } from 'vue'

interface MediaGalleryScrollOptions {
  hasMore: Ref<boolean>
  loading: Ref<boolean>
  loadingMore: Ref<boolean>
  search: Ref<string>
  viewMode?: Ref<'grid' | 'table'>
  /** Nested scroll container; omit for page-level scroll. */
  root?: Ref<HTMLElement | null | undefined>
  onLoadMore: () => void | Promise<void>
}

/**
 * Load the next media page when the sentinel enters the scrollport.
 */
export function useMediaGalleryInfiniteScroll(
  sentinel: Ref<HTMLElement | null>,
  opts: MediaGalleryScrollOptions,
) {
  useIntersectionObserver(
    sentinel,
    ([entry]) => {
      if (!entry?.isIntersecting) {
        return
      }
      if (opts.viewMode && opts.viewMode.value !== 'grid') {
        return
      }
      if (opts.search.value.trim()) {
        return
      }
      if (!opts.hasMore.value || opts.loading.value || opts.loadingMore.value) {
        return
      }
      void opts.onLoadMore()
    },
    {
      rootMargin: '240px',
      root: opts.root,
    },
  )
}
