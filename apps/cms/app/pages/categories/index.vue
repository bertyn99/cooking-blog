<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Category, PaginatedResponse } from '~/types/cms'

const { $api } = useNuxtApp()

const { data, status } = await useAsyncData('categories-list', () =>
  $api<PaginatedResponse<Category>>('/api/categories', { query: { pageSize: 50 } })
)

const columns: TableColumn<Category>[] = [
  { accessorKey: 'name', header: 'Nom' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'type', header: 'Type' }
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
          <UButton icon="i-lucide-plus" label="Nouvelle catégorie" disabled />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTable
        :data="data?.data ?? []"
        :columns="columns"
        :loading="status === 'pending'"
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
