<script setup lang="ts">
import type { CalendarContentType } from '#shared/calendar'
import type { DashboardRecentItem } from '#shared/dashboard'
import { DASHBOARD_STATUS_LABELS } from '#shared/dashboard'
import { DASHBOARD_SURFACE_CLASS, DASHBOARD_TABLE_UI } from '~/utils/dashboard-shell'

defineProps<{
  items: DashboardRecentItem[]
}>()

function typeLabel(contentType: CalendarContentType) {
  switch (contentType) {
    case 'articles':
      return 'Article'
    case 'recipes':
      return 'Recette'
    case 'pages':
      return 'Page'
  }
}

function statusColor(status: DashboardRecentItem['status']) {
  switch (status) {
    case 'published':
      return 'success' as const
    case 'scheduled':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}
</script>

<template>
  <section :class="[DASHBOARD_SURFACE_CLASS, 'overflow-hidden']">
    <div class="border-b border-default/70 px-4 py-3">
      <h2 class="text-sm font-semibold text-highlighted">
        Modifié récemment
      </h2>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[32rem] text-sm" :class="DASHBOARD_TABLE_UI.base">
        <thead :class="DASHBOARD_TABLE_UI.thead">
          <tr>
            <th :class="DASHBOARD_TABLE_UI.th" class="text-left font-medium text-muted">
              Titre
            </th>
            <th :class="DASHBOARD_TABLE_UI.th" class="text-left font-medium text-muted">
              Type
            </th>
            <th :class="DASHBOARD_TABLE_UI.th" class="text-left font-medium text-muted">
              Statut
            </th>
            <th :class="DASHBOARD_TABLE_UI.th" class="text-right font-medium text-muted">
              Modifié
            </th>
          </tr>
        </thead>
        <tbody :class="DASHBOARD_TABLE_UI.tbody">
          <tr v-for="item in items" :key="`${item.contentType}:${item.id}`">
            <td :class="DASHBOARD_TABLE_UI.td">
              <NuxtLink :to="item.editPath" class="font-medium text-highlighted hover:text-primary">
                {{ item.title }}
              </NuxtLink>
            </td>
            <td :class="DASHBOARD_TABLE_UI.td" class="text-muted">
              {{ typeLabel(item.contentType) }}
            </td>
            <td :class="DASHBOARD_TABLE_UI.td">
              <UBadge :color="statusColor(item.status)" variant="subtle" size="sm" class="capitalize">
                {{ DASHBOARD_STATUS_LABELS[item.status] }}
              </UBadge>
            </td>
            <td :class="DASHBOARD_TABLE_UI.td" class="text-right text-muted tabular-nums">
              {{ new Date(item.updatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
