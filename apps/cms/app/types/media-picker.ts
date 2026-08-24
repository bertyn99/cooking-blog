export interface StockSearchItem {
  id: string
  provider: 'pexels'
  width: number
  height: number
  alt: string
  photographer: string
  photographerUrl: string
  pageUrl: string
  previewUrl: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
}

export interface StockSearchResponse {
  items: StockSearchItem[]
  page: number
  perPage: number
  total: number
  hasMore: boolean
}

export type MediaPickerTab = 'library' | 'stock' | 'ai'

export type StockOrientation = 'landscape' | 'portrait' | 'square'

export type ImageAspectRatio = '1:1' | '4:3' | '16:9'

export type ImageGenerationModel = 'google/nano-banana-2' | 'bytedance/seedream-5-pro'

export interface PickerCapabilities {
  stock: boolean
  aiGenerate: boolean
}

export interface IngestResponse {
  pathname: string
  contentType: string
  size: number
  duplicate?: boolean
  modelId?: string
  usedFallback?: boolean
}
