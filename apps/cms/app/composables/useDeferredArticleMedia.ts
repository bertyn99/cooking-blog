import type { InjectionKey } from 'vue'
import { mediaPublicUrl } from '~/utils/media'
import { uploadMediaFile } from '~/utils/upload-media.client'

export interface DeferredLocalImage {
  previewUrl: string
  file: File
}

export interface DeferredArticleMediaContext {
  registerLocal: (image: DeferredLocalImage) => void
  setPendingCover: (image: DeferredLocalImage) => void
  clearPendingCover: () => void
  pendingCoverPreviewUrl: Readonly<Ref<string | null>>
  prepareArticlePayloadForSave: (
    content: string,
    coverBlobPathname: string | null,
  ) => Promise<{ content: string, coverBlobPathname: string | null }>
  dispose: () => void
}

export const DEFERRED_ARTICLE_MEDIA_KEY: InjectionKey<DeferredArticleMediaContext> = Symbol(
  'deferred-article-media',
)

export function provideDeferredArticleMedia() {
  const filesByUrl = new Map<string, File>()
  let pendingCover: DeferredLocalImage | null = null
  const pendingCoverPreviewUrl = ref<string | null>(null)

  function registerLocal(image: DeferredLocalImage) {
    filesByUrl.set(image.previewUrl, image.file)
  }

  function setPendingCover(image: DeferredLocalImage) {
    if (pendingCover?.previewUrl && pendingCover.previewUrl !== image.previewUrl) {
      URL.revokeObjectURL(pendingCover.previewUrl)
    }
    pendingCover = image
    pendingCoverPreviewUrl.value = image.previewUrl
  }

  function clearPendingCover() {
    if (pendingCover?.previewUrl) {
      URL.revokeObjectURL(pendingCover.previewUrl)
    }
    pendingCover = null
    pendingCoverPreviewUrl.value = null
  }

  function dispose() {
    for (const url of filesByUrl.keys()) {
      URL.revokeObjectURL(url)
    }
    filesByUrl.clear()
    clearPendingCover()
  }

  async function prepareArticlePayloadForSave(content: string, coverBlobPathname: string | null) {
    let newContent = content
    const blobUrls = [...filesByUrl.keys()].sort((a, b) => b.length - a.length)

    for (const blobUrl of blobUrls) {
      if (!newContent.includes(blobUrl)) {
        continue
      }
      const file = filesByUrl.get(blobUrl)
      if (!file) {
        continue
      }
      const pathname = await uploadMediaFile(file)
      newContent = newContent.split(blobUrl).join(mediaPublicUrl(pathname))
    }

    let cover = coverBlobPathname
    if (!cover && pendingCover) {
      cover = await uploadMediaFile(pendingCover.file)
    }

    return { content: newContent, coverBlobPathname: cover }
  }

  const context: DeferredArticleMediaContext = {
    registerLocal,
    setPendingCover,
    clearPendingCover,
    pendingCoverPreviewUrl: readonly(pendingCoverPreviewUrl),
    prepareArticlePayloadForSave,
    dispose,
  }

  provide(DEFERRED_ARTICLE_MEDIA_KEY, context)

  onUnmounted(() => {
    dispose()
  })

  return context
}

export function useDeferredArticleMedia() {
  return inject(DEFERRED_ARTICLE_MEDIA_KEY, null)
}
