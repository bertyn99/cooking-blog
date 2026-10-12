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
}>(), {
  showSlugColumn: true,
  showKindColumn: false,
  hideScheduledFilter: false,
  showKindFilter: false,
})

const basePath = computed(() => props.contentBasePath ?? props.endpoint.replace(/^\/api/, ''))

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

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

const { data, status } = await useAsyncData(
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

const statusColor = {
  draft: 'neutral',
  published: 'success',
  scheduled: 'warning',
} as const

const columns = computed<TableColumn<ContentRow>[]>(() => {
  const cols: TableColumn<ContentRow>[] = [
    { accessorKey: 'title', header: 'Titre' },
  ]
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

      <UTable
        class="mt-4 shrink-0"
        :data="rows"
        :columns="columns"
        :loading="status === 'pending'"
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
