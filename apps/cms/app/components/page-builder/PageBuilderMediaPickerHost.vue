<script setup lang="ts">
import {
  JdcMediaPickerKey,
  type JdcMediaPickCurrent,
  type JdcMediaPickResult,
} from '@journalducuistot/shared/markdown'
import { PUBLIC_SITE_IMAGES } from '#shared/content-blocks'
import { resolvePreviewMediaSrc } from '~/utils/preview-media'
import { mediaAltFromPathname } from '~/utils/media'

const { $api } = useNuxtApp()

const open = ref(false)
const pending = ref<JdcMediaPickCurrent | null>(null)
let resolvePick: ((value: JdcMediaPickResult | null) => void) | null = null

const selectedPathname = computed(() => {
  const src = String(pending.value?.src ?? '').trim()
  if (!src) return null
  if (src.startsWith('/img/')) return src
  if (src.startsWith('/images/')) return src.replace(/^\/images\//, '')
  if (/^https?:\/\//.test(src)) {
    try {
      const url = new URL(src)
      const fromImages = url.pathname.match(/^\/images\/(.+)$/)
      if (fromImages?.[1]) return fromImages[1]
      const fromPublic = url.pathname.match(/^\/img\/(.+)$/)
      if (fromPublic) return `/img/${fromPublic[1]}`
    }
    catch {
      return src
    }
  }
  return src.replace(/^\/+/, '')
})

function preview(src: string): string {
  return resolvePreviewMediaSrc(src)
}

async function altForSrc(src: string, currentAlt?: string): Promise<string> {
  const trimmed = currentAlt?.trim()
  if (src.startsWith('/img/')) {
    const siteItem = PUBLIC_SITE_IMAGES.find(item => item.src === src)
    return siteItem?.alt || trimmed || ''
  }
  const pathname = src.startsWith('/images/')
    ? src.replace(/^\/images\//, '')
    : src.replace(/^\/+/, '')
  try {
    const detail = await $api<{ altText?: string | null }>('/api/media/item', {
      query: { pathname },
    })
    const fromMedia = detail.altText?.trim()
    if (fromMedia) return fromMedia
  }
  catch {
    // Fall through to filename-derived alt.
  }
  return trimmed || mediaAltFromPathname(pathname)
}

function pick(current?: JdcMediaPickCurrent): Promise<JdcMediaPickResult | null> {
  pending.value = current ?? null
  open.value = true
  return new Promise((resolve) => {
    resolvePick = resolve
  })
}

function finish(result: JdcMediaPickResult | null) {
  resolvePick?.(result)
  resolvePick = null
  pending.value = null
  open.value = false
}

watch(open, (isOpen) => {
  if (!isOpen && resolvePick) {
    resolvePick(null)
    resolvePick = null
    pending.value = null
  }
})

async function onSelect(pathname: string) {
  const src = pathname
  const alt = await altForSrc(src, pending.value?.alt)
  finish({ src, alt })
}

provide(JdcMediaPickerKey, { pick, preview })
</script>

<template>
  <slot />
  <ContentMediaPickerModal
    v-model:open="open"
    title="Choisir une image"
    :selected-pathname="selectedPathname"
    include-site
    @select="onSelect"
  />
</template>
