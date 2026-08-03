<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { PaginatedResponse } from '~/types/cms'
import { DASHBOARD_TABLE_UI } from '~/utils/dashboard-shell'

interface CategoryRow {
  rowId: string
  id: number
  name: string
  slug: string
  type: 'Blog' | 'Recette'
}

const { $api } = useNuxtApp()

const {
  data: recipeCategories,
  status: recipeStatus,
  refresh: refreshRecipeCategories,
} = await useAsyncData(
  'categories-recipes-list',
  () => $api<PaginatedResponse<{ id: number, name: string, slug: string }>>('/api/admin/categories', {
    query: { pageSize: 100 },
  }),
  { getCachedData: () => undefined },
)

const {
  data: articleCategories,
  status: articleStatus,
  refresh: refreshArticleCategories,
} = await useAsyncData(
  'categories-articles-list',
  () => $api<PaginatedResponse<{ id: number, name: string, slug: string }>>('/api/admin/category-articles', {
    query: { pageSize: 100 },
  }),
  { getCachedData: () => undefined },
)

onMounted(() => {
  void refreshRecipeCategories()
  void refreshArticleCategories()
})

const rows = computed<CategoryRow[]>(() => [
  ...(articleCategories.value?.data ?? []).map(row => ({
    rowId: `blog-${row.id}`,
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: 'Blog' as const,
  })),
  ...(recipeCategories.value?.data ?? []).map(row => ({
    rowId: `recipe-${row.id}`,
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: 'Recette' as const,
  })),
])

const loading = computed(() => recipeStatus.value === 'pending' || articleStatus.value === 'pending')

const columns: TableColumn<CategoryRow>[] = [
  { accessorKey: 'name', header: 'Nom' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'type', header: 'Type' },
]
</script>

<template>
  <AppDashboardPanel id="categories">
    <template #header>
      <AppDashboardNavbar title="Catégories">
        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="Nouvelle catégorie"
            to="/categories/new"
          />
        </template>
      </AppDashboardNavbar>
    </template>

    <template #body>
      <p class="mb-4 text-sm text-muted">
        Les catégories <strong>blog</strong> (import Strapi « Catégories blog ») et les catégories
        <strong>recette</strong> (« Catégories recettes ») sont listées ici. Elles ne partagent pas la même table.
      </p>

      <UTable
        :data="rows"
        :columns="columns"
        :loading="loading"
        :get-row-id="row => row.rowId"
        :ui="DASHBOARD_TABLE_UI"
      />
    </template>
  </AppDashboardPanel>
</template>
