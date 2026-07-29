<script setup lang="ts">
import { DASHBOARD_STATUS_LABELS, type DashboardPipelineRow } from '#shared/dashboard'
import { DASHBOARD_SURFACE_CLASS, DASHBOARD_TABLE_UI } from '~/utils/dashboard-shell'

defineProps<{
  rows: DashboardPipelineRow[]
}>()

const statusColumns = [
  { key: 'draft' as const, label: DASHBOARD_STATUS_LABELS.draft, color: 'neutral' as const },
  { key: 'scheduled' as const, label: DASHBOARD_STATUS_LABELS.scheduled, color: 'warning' as const },
  { key: 'published' as const, label: DASHBOARD_STATUS_LABELS.published, color: 'success' as const },
]

function cellLink(row: DashboardPipelineRow, status: keyof typeof DASHBOARD_STATUS_LABELS) {
  if (status === 'scheduled') {
    return '/planning'
  }
  return row.listPath
}
</script>

<template>
  <section :class="[DASHBOARD_SURFACE_CLASS, 'overflow-hidden']">
    <div class="border-b border-default/70 px-4 py-3">
      <h2 class="text-sm font-semibold text-highlighted">
        Pipeline éditorial
      </h2>
      <p class="mt-0.5 text-xs text-muted">
        Brouillons, publications programmées et contenus en ligne (locale fr).
      </p>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[28rem] text-sm" :class="DASHBOARD_TABLE_UI.base">
        <thead :class="DASHBOARD_TABLE_UI.thead">
          <tr>
            <th :class="DASHBOARD_TABLE_UI.th" class="text-left font-medium text-muted">
              Type
            </th>
            <th
              v-for="col in statusColumns"
              :key="col.key"
              :class="DASHBOARD_TABLE_UI.th"
              class="text-right font-medium text-muted"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody :class="DASHBOARD_TABLE_UI.tbody">
          <tr v-for="row in rows" :key="row.contentType">
            <td :class="DASHBOARD_TABLE_UI.td" class="font-medium text-highlighted">
              <NuxtLink :to="row.listPath" class="hover:text-primary">
                {{ row.label }}
              </NuxtLink>
            </td>
            <td
              v-for="col in statusColumns"
              :key="col.key"
              :class="DASHBOARD_TABLE_UI.td"
              class="text-right"
            >
              <NuxtLink
                :to="cellLink(row, col.key)"
                class="inline-flex min-w-[2ch] justify-end tabular-nums hover:text-primary"
              >
                <UBadge
                  :color="row[col.key] > 0 ? col.color : 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{ row[col.key] }}
                </UBadge>
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
