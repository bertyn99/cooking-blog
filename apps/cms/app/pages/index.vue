<script setup lang="ts">
import type { PaginatedResponse } from '~/types/cms'

const requestFetch = useRequestFetch()

const { data: articles } = await useAsyncData('dashboard-articles', () =>
  requestFetch<PaginatedResponse<{ id: number }>>('/api/articles', { query: { pageSize: 1 } })
)

const { data: recipes } = await useAsyncData('dashboard-recipes', () =>
  requestFetch<PaginatedResponse<{ id: number }>>('/api/recipes', { query: { pageSize: 1 } })
)

const { data: pages } = await useAsyncData('dashboard-pages', () =>
  requestFetch<PaginatedResponse<{ id: number }>>('/api/pages', { query: { pageSize: 1 } })
)

const { data: categories } = await useAsyncData('dashboard-categories', () =>
  requestFetch<PaginatedResponse<{ id: number }>>('/api/categories', { query: { pageSize: 1 } })
)

const stats = computed(() => [
  {
    label: 'Articles',
    value: articles.value?.meta.pagination.total ?? 0,
    icon: 'i-lucide-newspaper',
    to: '/articles',
    color: 'primary' as const
  },
  {
    label: 'Recettes',
    value: recipes.value?.meta.pagination.total ?? 0,
    icon: 'i-lucide-utensils',
    to: '/recipes',
    color: 'warning' as const
  },
  {
    label: 'Pages',
    value: pages.value?.meta.pagination.total ?? 0,
    icon: 'i-lucide-file-text',
    to: '/pages',
    color: 'info' as const
  },
  {
    label: 'Catégories',
    value: categories.value?.meta.pagination.total ?? 0,
    icon: 'i-lucide-folder',
    to: '/categories',
    color: 'success' as const
  }
])
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Tableau de bord">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UPageCard
          v-for="stat in stats"
          :key="stat.label"
          :to="stat.to"
          class="transition-colors hover:bg-elevated/50"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-sm text-muted">
                {{ stat.label }}
              </p>
              <p class="mt-1 text-2xl font-semibold text-highlighted">
                {{ stat.value }}
              </p>
            </div>
            <UIcon :name="stat.icon" class="size-8 text-dimmed" />
          </div>
        </UPageCard>
      </div>

      <UPageCard title="Bienvenue" class="mt-6">
        <p class="text-muted">
          Interface d'administration du Journal du Cuistot. Utilisez la barre latérale pour gérer
          les articles, recettes, pages, catégories et médias.
        </p>
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>
