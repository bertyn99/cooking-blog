<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

interface BlobItem {
  pathname: string
  contentType?: string
  size?: number
  uploadedAt?: string
}

interface MediaListResponse {
  blobs: BlobItem[]
  hasMore: boolean
  cursor?: string
}

const { $api } = useNuxtApp()

const { data, status } = await useAsyncData('media-list', () =>
  $api<MediaListResponse>('/api/media', { query: { limit: 50 } })
)

const columns: TableColumn<BlobItem>[] = [
  {
    accessorKey: 'pathname',
    header: 'Fichier',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-3' }, [
      h(resolveComponent('UAvatar'), {
        src: `/images/${row.original.pathname}`,
        alt: row.original.pathname,
        size: 'lg'
      }),
      h('span', { class: 'truncate' }, row.original.pathname)
    ])
  },
  {
    accessorKey: 'contentType',
    header: 'Type',
    cell: ({ row }) => row.original.contentType ?? '—'
  },
  {
    accessorKey: 'size',
    header: 'Taille',
    cell: ({ row }) => row.original.size
      ? `${Math.round(row.original.size / 1024)} Ko`
      : '—'
  }
]
</script>

<template>
  <UDashboardPanel id="media">
    <template #header>
      <UDashboardNavbar title="Médias">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton icon="i-lucide-upload" label="Importer" disabled />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTable
        :data="data?.blobs ?? []"
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
