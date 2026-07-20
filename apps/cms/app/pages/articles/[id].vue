<script setup lang="ts">
const route = useRoute()
const { $api } = useNuxtApp()

const id = computed(() => Number.parseInt(route.params.id as string, 10))

const { data: article, status } = await useAsyncData(
  () => `article-${id.value}`,
  () => $api<{
    id: number
    title: string
    slug: string
    content: string | null
    categoryId: number | null
    status: string
  }>(`/api/articles/${id.value}`),
  { watch: [id] },
)
</script>

<template>
  <UDashboardPanel id="article-edit">
    <template #header>
      <UDashboardNavbar :title="article?.title ?? 'Éditer l\'article'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="status === 'pending'" class="text-muted">
        Chargement…
      </div>

      <ContentArticleForm
        v-else-if="article"
        :article-id="article.id"
        :initial="{
          title: article.title,
          slug: article.slug,
          content: article.content ?? undefined,
          categoryId: article.categoryId ?? undefined,
          status: article.status,
        }"
      />

      <UAlert
        v-else
        color="error"
        title="Article introuvable"
        description="Cet article n'existe pas ou a été supprimé."
      />
    </template>
  </UDashboardPanel>
</template>
