<script setup lang="ts">
const route = useRoute()
const { $api } = useNuxtApp()

const id = computed(() => Number.parseInt(route.params.id as string, 10))

interface ArticleDetail {
  id: number
  title: string
  slug: string
  content: string | null
  categoryId: number | null
  status: string
  coverBlobPathname: string | null
  coverAltText?: string | null
  coverDescription?: string | null
  cover?: { pathname: string, originalName: string | null } | null
  seo?: {
    description: string | null
    keywords: string | null
    metaRobots: string | null
  } | null
}

const { data: article, status } = await useAsyncData(
  () => `article-${id.value}`,
  () => $api<ArticleDetail>(`/api/articles/${id.value}`, {
    query: { include: 'cover,category,seo' },
  }),
  { watch: [id] },
)
</script>

<template>
  <ContentEditorDetailLayout
    resource-label="Articles"
    resource-to="/articles"
    :title="article?.title"
    :subtitle="article?.slug"
    :loading="status === 'pending'"
  >
    <ContentArticleForm
      v-if="article"
      :article-id="article.id"
      :initial="{
        title: article.title,
        slug: article.slug,
        content: article.content ?? undefined,
        categoryId: article.categoryId ?? undefined,
        status: article.status,
        coverBlobPathname: article.coverBlobPathname,
        coverAltText: article.coverAltText ?? null,
        coverDescription: article.coverDescription ?? null,
        coverDisplayName: article.cover?.originalName ?? article.cover?.pathname ?? null,
        seo: article.seo,
      }"
    />

    <UAlert
      v-else-if="status !== 'pending'"
      color="error"
      title="Article introuvable"
      description="Cet article n'existe pas ou a été supprimé."
      class="mx-auto max-w-lg"
    />
  </ContentEditorDetailLayout>
</template>
