<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { ContentStatus } from '~/types/cms'
import { DASHBOARD_TABLE_UI } from '~/utils/dashboard-shell'

export interface ContentRow {
  id: number
  title: string
  slug: string
  status: ContentStatus
  locale: string
  publishedAt: string | null
  updatedAt: string
}

const props = withDefaults(defineProps<{
  title: string
  panelId: string
  endpoint: string
  createLabel?: string
  /** Base path for create/edit routes, e.g. `/articles` */
  contentBasePath?: string
  /** Show slug column (hidden for articles list). */
  showSlugColumn?: boolean
}>(), {
  showSlugColumn: true,
})

const router = useRouter()

const basePath = computed(() => props.contentBasePath ?? props.endpoint.replace(/^\/api/, ''))

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

const columns = computed<TableColumn<ContentRow>[]>(() => {
  const cols: TableColumn<ContentRow>[] = [
    { accessorKey: 'title', header: 'Titre' },
  ]
  if (props.showSlugColumn) {
    cols.push({ accessorKey: 'slug', header: 'Slug' })
  }
  cols.push(
    { accessorKey: 'locale', header: 'Locale' },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => h(UBadge, {
        class: 'capitalize',
        variant: 'subtle',
        color: statusColor[row.original.status],
      }, () => row.original.status),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Modifié',
      cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString('fr-FR'),
    },
    {
      id: 'actions',
      cell: ({ row }) => h(UButton, {
        icon: 'i-lucide-pencil',
        color: 'neutral',
        variant: 'ghost',
        size: 'sm',
        onClick: () => router.push(`${basePath.value}/${row.original.id}`),
      }),
    },
  )
  return cols
})

watch([search, statusFilter], () => {
  pagination.value.pageIndex = 0
})
</script>

<template>
  <AppDashboardPanel :id="panelId">
    <template #header>
      <AppDashboardNavbar :title="title">
        <template #right>
          <UButton
            :label="createLabel ?? 'Nouveau'"
            icon="i-lucide-plus"
            :to="`${basePath}/new`"
          />
        </template>
      </AppDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput v-model="search" class="max-w-sm" icon="i-lucide-search" placeholder="Rechercher..." />

        <USelect v-model="statusFilter" :items="[
          { label: 'Tous', value: 'all' },
          { label: 'Brouillon', value: 'draft' },
          { label: 'Publié', value: 'published' },
          { label: 'Planifié', value: 'scheduled' }
        ]" class="min-w-36" />
      </div>

      <UTable ref="table" v-model:pagination="pagination"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }" class="mt-4 shrink-0" :data="rows"
        :columns="columns"         :loading="status === 'pending'"
        :ui="DASHBOARD_TABLE_UI"
      />

      <div class="mt-4 flex items-center justify-between gap-3 pt-2">
        <p class="text-sm text-muted">
          {{ data?.meta.pagination.total ?? 0 }} élément(s) au total
        </p>

        <UPagination :default-page="pagination.pageIndex + 1" :items-per-page="pagination.pageSize"
          :total="data?.meta.pagination.total ?? 0"
          @update:page="(p: number) => { pagination.pageIndex = p - 1; refresh() }" />
      </div>
    </template>
  </AppDashboardPanel>
</template>
