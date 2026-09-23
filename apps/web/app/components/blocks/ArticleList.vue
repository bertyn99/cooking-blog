<script lang="ts" setup>
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  source?: string
  category?: string
  slugs?: string
  limit?: string | number
}>()

const { data: articles, status, error } = await useBlockArticleList(props)
</script>

<template>
  <div>
    <p v-if="status === 'pending'" class="sr-only">
      Chargement des articles…
    </p>
    <p v-else-if="error" class="text-sm text-neutral-500">
      Impossible de charger les articles.
    </p>
    <p v-else-if="!articles?.length" class="text-sm text-neutral-500">
      Aucun article pour le moment.
    </p>
    <LazySectionRecentArticles
      v-else
      :articles="articles"
    />
  </div>
</template>
