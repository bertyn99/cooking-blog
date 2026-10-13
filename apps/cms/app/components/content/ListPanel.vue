<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
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
  kind?: string
}

type ListResponse = {
  data: ContentRow[]
  meta: { pagination: { page: number, pageSize: number, total: number, pageCount: number } }
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
  showKindColumn?: boolean
  hideScheduledFilter?: boolean
  showKindFilter?: boolean
  enableBulkActions?: boolean
  bulkNounSingular?: string
  bulkNounPlural?: string
  bulkNounFeminine?: boolean
}>(), {
  showSlugColumn: true,
  showKindColumn: false,
  hideScheduledFilter: false,
  showKindFilter: false,
  enableBulkActions: false,
  bulkNounSingular: 'élément',
  bulkNounPlural: 'éléments',
  bulkNounFeminine: false,
})

const basePath = computed(() => props.contentBasePath ?? props.endpoint.replace(/^\/api/, ''))

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UCheckbox = resolveComponent('UCheckbox')

const { $api } = useNuxtApp()

const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const statusFilter = ref<'all' | ContentStatus>('all')
const kindFilter = ref<'all' | 'ingredient' | 'technique' | 'ustensile'>('all')
const page = ref(1)
const pageSize = 10

const kindLabels: Record<'ingredient' | 'technique' | 'ustensile', string> = {
  ingredient: 'Ingrédient',
  technique: 'Technique',
  ustensile: 'Ustensile',
}

watch([debouncedSearch, statusFilter, kindFilter], () => {
  page.value = 1
})

const listKey = computed(() =>
  `content-list-${props.endpoint}-p${page.value}-q${debouncedSearch.value}-st${statusFilter.value}-k${kindFilter.value}`,
)

const { data, status, refresh } = await useAsyncData(
  listKey,
  () => $api<ListResponse>(props.endpoint, {
    query: {
      page: page.value,
      pageSize,
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
      ...(statusFilter.value !== 'all' ? { status: statusFilter.value } : {}),
      ...(props.showKindFilter && kindFilter.value !== 'all' ? { kind: kindFilter.value } : {}),
    },
  }),
)

const statusFilterItems = computed(() => {
  const items = [
    { label: 'Tous', value: 'all' },
    { label: 'Brouillon', value: 'draft' },
    { label: 'Publié', value: 'published' },
  ]
  if (!props.hideScheduledFilter) {
    items.push({ label: 'Planifié', value: 'scheduled' })
  }
  return items
})

watch(
  () => data.value?.meta.pagination.pageCount,
  (pageCount) => {
    if (pageCount && page.value > pageCount) {
      page.value = pageCount
    }
  },
)

const rows = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta.pagination.total ?? 0)

const bulk = useContentBulkSelection({
  endpoint: () => props.endpoint,
  noun: () => ({
    singular: props.bulkNounSingular,
    plural: props.bulkNounPlural,
    feminine: props.bulkNounFeminine,
  }),
  refresh,
  visibleIds: () => rows.value.map(row => row.id),
})
const {
  rowSelection,
  bulkLoading,
  deleteConfirmOpen,
  selectedCount,
  selectedHint,
  canBulkChangeStatus,
  deleteConfirmDescription,
  bulkStatusItems,
  clearSelection,
  trySelect,
  trySelectMany,
  confirmBulkDelete,
} = bulk

const statusColor = {
  draft: 'neutral',
  published: 'success',
  scheduled: 'warning',
} as const

const selectColumn: TableColumn<ContentRow> = {
  id: 'select',
  header: ({ table }) => h(UCheckbox, {
    'modelValue': table.getIsSomePageRowsSelected()
      ? 'indeterminate'
      : table.getIsAllPageRowsSelected(),
    'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
      trySelectMany(table.getRowModel().rows.map(row => String(row.id)), !!value),
    'aria-label': 'Tout sélectionner sur la page',
  }),
  cell: ({ row }) => h(UCheckbox, {
    'modelValue': row.getIsSelected(),
    'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
      trySelect(String(row.id), !!value),
    'aria-label': `Sélectionner ${row.original.title}`,
  }),
  enableSorting: false,
  enableHiding: false,
  meta: {
    class: {
      th: 'w-12 px-3',
      td: 'w-12 px-3',
    },
  },
}

const columns = computed<TableColumn<ContentRow>[]>(() => {
  const cols: TableColumn<ContentRow>[] = []
  if (props.enableBulkActions) {
    cols.push(selectColumn)
  }
  cols.push({ accessorKey: 'title', header: 'Titre' })
  if (props.showKindColumn) {
    cols.push({
      accessorKey: 'kind',
      header: 'Type',
      cell: ({ row }) => {
        const kind = row.original.kind
        if (kind === 'ingredient' || kind === 'technique' || kind === 'ustensile') {
          return kindLabels[kind]
        }
        return kind ?? ''
      },
    })
  }
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
        to: `${basePath.value}/${row.original.id}`,
        'aria-label': 'Modifier',
      }),
    },
  )
  return cols
})

function getRowId(row: ContentRow) {
  return String(row.id)
}
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

        <div class="flex flex-wrap items-center gap-1.5">
          <USelect
            v-if="showKindFilter"
            v-model="kindFilter"
            :items="[
              { label: 'Tous les types', value: 'all' },
              { label: 'Ingrédient', value: 'ingredient' },
              { label: 'Technique', value: 'technique' },
              { label: 'Ustensile', value: 'ustensile' },
            ]"
            class="min-w-40"
          />
          <USelect v-model="statusFilter" :items="statusFilterItems" class="min-w-36" />
        </div>
      </div>

      <ContentBulkToolbar
        v-if="enableBulkActions"
        v-model:delete-open="deleteConfirmOpen"
        :selected-count="selectedCount"
        :selected-hint="selectedHint"
        :can-change-status="canBulkChangeStatus"
        :status-items="bulkStatusItems"
        :loading="bulkLoading"
        :delete-description="deleteConfirmDescription"
        @clear="clearSelection"
        @confirm-delete="confirmBulkDelete"
      />

      <UTable
        v-model:row-selection="rowSelection"
        class="mt-4 shrink-0"
        :data="rows"
        :columns="columns"
        :loading="status === 'pending' || bulkLoading"
        :get-row-id="getRowId"
        :ui="DASHBOARD_TABLE_UI"
      />

      <div class="mt-4 flex items-center justify-between gap-3 pt-2">
        <p class="text-sm text-muted">
          {{ total }} élément(s) au total
        </p>

        <UPagination
          v-if="total > pageSize"
          v-model:page="page"
          :items-per-page="pageSize"
          :total="total"
          show-edges
        />
      </div>

    </template>
  </AppDashboardPanel>
</template>
