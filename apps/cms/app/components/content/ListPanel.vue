<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { ContentStatus } from '~/types/cms'

export interface ContentRow {
  id: number
  title: string
  slug: string
  status: ContentStatus
  locale: string
  publishedAt: string | null
  updatedAt: string
}

const props = defineProps<{
  title: string
  panelId: string
  endpoint: string
  createLabel?: string
}>()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const { $api } = useNuxtApp()
const table = useTemplateRef('table')

const search = ref('')
const statusFilter = ref<'all' | ContentStatus>('all')
const pagination = ref({ pageIndex: 0, pageSize: 10 })

const { data, status, refresh } = await useAsyncData(
  () => `content-list-${props.endpoint}`,
  () => $api<{ data: ContentRow[], meta: { pagination: { total: number } } }>(props.endpoint, {
    query: {
      page: pagination.value.pageIndex + 1,
      pageSize: pagination.value.pageSize
    }
  }),
  { watch: [pagination] }
)

const rows = computed(() => {
  let items = data.value?.data ?? []

  if (search.value) {
    const q = search.value.toLowerCase()
    items = items.filter(item =>
      item.title.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q)
    )
  }

  if (statusFilter.value !== 'all') {
    items = items.filter(item => item.status === statusFilter.value)
  }

  return items
})

const statusColor = {
  draft: 'neutral',
  published: 'success',
  scheduled: 'warning'
} as const

const columns: TableColumn<ContentRow>[] = [
  { accessorKey: 'title', header: 'Titre' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'locale', header: 'Locale' },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => h(UBadge, {
      class: 'capitalize',
      variant: 'subtle',
      color: statusColor[row.original.status]
    }, () => row.original.status)
  },
  {
    accessorKey: 'updatedAt',
    header: 'Modifié',
    cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString('fr-FR')
  },
  {
    id: 'actions',
    cell: ({ row }) => h(UButton, {
      icon: 'i-lucide-pencil',
      color: 'neutral',
      variant: 'ghost',
      size: 'sm',
      disabled: true,
      title: 'Édition à venir'
    })
  }
]

watch([search, statusFilter], () => {
  pagination.value.pageIndex = 0
})
</script>

<template>
  <UDashboardPanel :id="panelId">
    <template #header>
      <UDashboardNavbar :title="title">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            :label="createLabel ?? 'Nouveau'"
            icon="i-lucide-plus"
            disabled
            title="Création à venir"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Rechercher..."
        />

        <USelect
          v-model="statusFilter"
          :items="[
            { label: 'Tous', value: 'all' },
            { label: 'Brouillon', value: 'draft' },
            { label: 'Publié', value: 'published' },
            { label: 'Planifié', value: 'scheduled' }
          ]"
          class="min-w-36"
        />
      </div>

      <UTable
        ref="table"
        v-model:pagination="pagination"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="mt-4 shrink-0"
        :data="rows"
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

      <div class="mt-4 flex items-center justify-between gap-3 border-t border-default pt-4">
        <p class="text-sm text-muted">
          {{ data?.meta.pagination.total ?? 0 }} élément(s) au total
        </p>

        <UPagination
          :default-page="pagination.pageIndex + 1"
          :items-per-page="pagination.pageSize"
          :total="data?.meta.pagination.total ?? 0"
          @update:page="(p: number) => { pagination.pageIndex = p - 1; refresh() }"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
