<script setup lang="ts">
import { previewCoverSrc, usePreviewArticleList } from '~/composables/usePreviewBlockList'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  source?: string
  category?: string
  slugs?: string
  limit?: string | number
}>()

const { data: articles, status, error } = await usePreviewArticleList(props)
</script>

<template>
  <div class="py-6">
    <p class="mb-4 text-lg font-semibold text-highlighted">
      Derniers articles
    </p>
    <p
      v-if="status === 'pending'"
      class="text-sm text-muted"
    >
      Chargement des articles…
    </p>
    <p
      v-else-if="error"
      class="text-sm text-muted"
    >
      Impossible de charger les articles.
    </p>
    <p
      v-else-if="!articles?.length"
      class="text-sm text-muted"
    >
      Aucun article pour le moment.
    </p>
    <ul
      v-else
      class="divide-y divide-default overflow-hidden rounded-lg border border-default bg-default"
    >
      <li
        v-for="article in articles"
        :key="article.id"
        class="flex items-center gap-3 px-3 py-3"
      >
        <img
          v-if="previewCoverSrc(article.coverBlobPathname)"
          :src="previewCoverSrc(article.coverBlobPathname)"
          :alt="article.title"
          class="size-14 shrink-0 rounded object-cover"
        >
        <div
          v-else
          class="flex size-14 shrink-0 items-center justify-center rounded bg-elevated text-[10px] text-muted"
        >
          Article
        </div>
        <p class="min-w-0 text-sm font-medium">
          {{ article.title }}
        </p>
      </li>
    </ul>
  </div>
</template>
