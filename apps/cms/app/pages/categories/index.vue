<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { PaginatedResponse } from '~/types/cms'

interface CategoryRow {
  rowId: string
  id: number
  name: string
  slug: string
  type: 'Blog' | 'Recette'
}

const { $api } = useNuxtApp()

const { data: recipeCategories, status: recipeStatus } = await useAsyncData(
  'categories-recipes-list',
  () => $api<PaginatedResponse<{ id: number, name: string, slug: string }>>('/api/categories', {
    query: { pageSize: 100 },
  }),
)

const { data: articleCategories, status: articleStatus } = await useAsyncData(
  'categories-articles-list',
  () => $api<PaginatedResponse<{ id: number, name: string, slug: string }>>('/api/category-articles', {
    query: { pageSize: 100 },
  }),
)

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
  <UDashboardPanel id="categories">
    <template #header>
      <UDashboardNavbar title="Catégories">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="Nouvelle catégorie"
            to="/categories/new"
          />
        </template>
      </UDashboardNavbar>
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
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
      />
    </template>
  </UDashboardPanel>
</template>
