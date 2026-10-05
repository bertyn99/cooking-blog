<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getApiErrorMessage } from '#shared/api-error'
import { DASHBOARD_TABLE_UI } from '~/utils/dashboard-shell'

definePageMeta({
  middleware: ['admin'],
})

type McpLogRow = {
  id: number
  action: string
  entityType: string
  entityId: string
  metadata: Record<string, unknown> | null
  createdAt: string
  keyPrefix: string | null
  keyName: string | null
}

type McpLogsResponse = {
  data: McpLogRow[]
  meta: { pagination: { page: number, pageSize: number, total: number, pageCount: number } }
}

const { $api } = useNuxtApp()
const toast = useToast()

const filters = reactive({
  action: '',
  entityType: '',
  keyPrefix: '',
})

const page = ref(1)
const pageSize = 25

const { data, status, refresh } = await useAsyncData(
  () => `mcp-logs-p${page.value}-a${filters.action}-e${filters.entityType}-k${filters.keyPrefix}`,
  () => $api<McpLogsResponse>('/api/admin/mcp-logs', {
    query: {
      page: page.value,
      pageSize,
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.keyPrefix ? { keyPrefix: filters.keyPrefix } : {}),
    },
  }),
)

watch(
  () => data.value?.meta.pagination.pageCount,
  (pageCount) => {
    if (pageCount && page.value > pageCount) {
      page.value = pageCount
    }
  },
)

watch(filters, () => {
  page.value = 1
}, { deep: true })

const rows = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta.pagination.total ?? 0)

function entityLink(row: McpLogRow): string | null {
  const id = row.entityId
  if (row.entityType === 'article') return `/articles/${id}`
  if (row.entityType === 'recipe') return `/recipes/${id}`
  if (row.entityType === 'page') return `/pages/${id}`
  return null
}

function actionLabel(action: string) {
  if (action === 'mcp.tool') return 'Outil MCP'
  if (action === 'content.create') return 'Création'
  if (action === 'content.update') return 'Mise à jour'
  return action
}

const columns: TableColumn<McpLogRow>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('fr-FR'),
  },
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ row }) => actionLabel(row.original.action),
  },
  {
    accessorKey: 'entityType',
    header: 'Entité',
    cell: ({ row }) => `${row.original.entityType} #${row.original.entityId}`,
  },
  {
    accessorKey: 'keyPrefix',
    header: 'Clé',
    cell: ({ row }) => row.original.keyPrefix ?? '—',
  },
]

async function applyFilters() {
  page.value = 1
  try {
    await refresh()
  }
  catch (error) {
    toast.add({
      title: 'Chargement impossible',
      description: getApiErrorMessage(error),
      color: 'error',
    })
  }
}
</script>

<template>
  <AppDashboardPanel id="mcp-logs">
    <template #header>
      <AppDashboardNavbar title="Journal MCP" />
    </template>

    <div class="space-y-4 p-4 sm:p-6">
      <p class="text-sm text-muted">
        Actions des agents via clés API (créations, mises à jour, lectures MCP). Les publications humaines n’apparaissent pas ici.
      </p>

      <form class="flex flex-wrap gap-3 items-end" @submit.prevent="applyFilters">
        <UFormField label="Action">
          <UInput v-model="filters.action" placeholder="mcp.tool, content.create…" class="min-w-40" />
        </UFormField>
        <UFormField label="Type">
          <UInput v-model="filters.entityType" placeholder="article, recipe…" class="min-w-32" />
        </UFormField>
        <UFormField label="Préfixe clé">
          <UInput v-model="filters.keyPrefix" placeholder="jdc_…" class="min-w-32" />
        </UFormField>
        <UButton type="submit" label="Filtrer" />
      </form>

      <UTable
        :data="rows"
        :columns="columns"
        :loading="status === 'pending'"
        :ui="DASHBOARD_TABLE_UI"
      >
        <template #entityType-cell="{ row }">
          <NuxtLink
            v-if="entityLink(row.original)"
            :to="entityLink(row.original)!"
            class="text-primary hover:underline"
          >
            {{ row.original.entityType }} #{{ row.original.entityId }}
          </NuxtLink>
          <span v-else>{{ row.original.entityType }} #{{ row.original.entityId }}</span>
        </template>
      </UTable>

      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-muted">
          {{ total }} entrée(s)
        </p>
        <UPagination
          v-if="total > pageSize"
          v-model:page="page"
          :items-per-page="pageSize"
          :total="total"
          show-edges
        />
      </div>
    </div>
  </AppDashboardPanel>
</template>
