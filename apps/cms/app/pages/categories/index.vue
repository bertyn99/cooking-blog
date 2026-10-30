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
  status: 'draft' | 'published' | 'scheduled'
}

const { $api } = useNuxtApp()

const {
  data: recipeCategories,
  status: recipeStatus,
  refresh: refreshRecipeCategories,
} = await useAsyncData(
  'categories-recipes-list',
  () => $api<PaginatedResponse<{ id: number, name: string, slug: string, status: 'draft' | 'published' | 'scheduled' }>>('/api/admin/categories', {
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
  () => $api<PaginatedResponse<{ id: number, name: string, slug: string, status: 'draft' | 'published' | 'scheduled' }>>('/api/admin/category-articles', {
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
    status: row.status,
  })),
  ...(recipeCategories.value?.data ?? []).map(row => ({
    rowId: `recipe-${row.id}`,
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: 'Recette' as const,
    status: row.status,
  })),
])

const loading = computed(() => recipeStatus.value === 'pending' || articleStatus.value === 'pending')

function onRowSelect(_event: Event, row: CategoryRow) {
  void navigateTo({
    path: `/categories/${row.id}`,
    query: { type: row.type === 'Blog' ? 'blog' : 'recette' },
  })
}

const columns: TableColumn<CategoryRow>[] = [
  { accessorKey: 'name', header: 'Nom' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'status', header: 'Statut' },
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
        Cliquez sur une ligne pour la modifier, la publier ou la dépublier.
      </p>

      <UTable
        :data="rows"
        :columns="columns"
        :loading="loading"
        :get-row-id="row => row.rowId"
        :ui="{ ...DASHBOARD_TABLE_UI, tr: 'cursor-pointer' }"
        @select="onRowSelect"
      >
        <template #status-cell="{ row }">
          <ContentStatusBadge :status="row.original.status" />
        </template>
      </UTable>
    </template>
  </AppDashboardPanel>
</template>
