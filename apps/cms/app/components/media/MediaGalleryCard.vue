<script setup lang="ts">
import { formatMediaByteSize } from '#shared/media'
import { mediaKindLabel, type MediaKind } from '#shared/media-paths'
import { mediaThumbnailUrl } from '~/utils/media'

const props = defineProps<{
  pathname: string
  kind: MediaKind
  originalName?: string
  size?: number
}>()

const emit = defineEmits<{
  open: []
}>()

const displayName = computed(
  () => props.originalName ?? props.pathname.split('/').pop() ?? props.pathname,
)

const isImage = computed(() => props.kind === 'image')
</script>

<template>
  <button
    type="button"
    class="group relative aspect-square w-full overflow-hidden rounded-lg border border-default/70 bg-default text-left shadow-sm ring-default/40 transition duration-200 hover:border-primary/50 hover:shadow-md hover:ring-2 hover:ring-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98]"
    @click="emit('open')"
  >
    <div class="absolute inset-0 bg-elevated/30">
      <img
        v-if="isImage"
        :src="mediaThumbnailUrl(pathname)"
        :alt="displayName"
        class="size-full object-cover transition duration-300 group-hover:scale-[1.04]"
        loading="lazy"
      >
      <div
        v-else
        class="flex size-full flex-col items-center justify-center gap-2 p-4"
      >
        <UIcon
          name="i-lucide-file"
          class="size-10 text-muted"
        />
        <UBadge
          color="neutral"
          variant="subtle"
          size="sm"
        >
          {{ mediaKindLabel(kind) }}
        </UBadge>
      </div>
    </div>

    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-2.5 pb-2 pt-10"
      aria-hidden="true"
    />

    <div class="pointer-events-none absolute inset-x-0 bottom-0 px-2.5 pb-2">
      <p class="truncate text-xs font-medium leading-snug text-white">
        {{ displayName }}
      </p>
      <p
        v-if="size"
        class="text-[10px] leading-tight text-white/80"
      >
        {{ formatMediaByteSize(size) }}
      </p>
    </div>

    <div
      class="pointer-events-none absolute right-2 top-2 flex size-7 items-center justify-center rounded-md bg-black/45 text-white opacity-0 backdrop-blur-sm transition duration-200 group-hover:opacity-100"
      aria-hidden="true"
    >
      <UIcon
        name="i-lucide-maximize-2"
        class="size-3.5"
      />
    </div>
  </button>
</template>
