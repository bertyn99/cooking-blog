<script setup lang="ts">
import type { CalendarContentType } from '#shared/calendar'
import type { DashboardBacklogItem } from '#shared/dashboard'
import { DASHBOARD_SURFACE_CLASS } from '~/utils/dashboard-shell'

defineProps<{
  items: DashboardBacklogItem[]
}>()

function typeMeta(contentType: CalendarContentType) {
  switch (contentType) {
    case 'articles':
      return { icon: 'i-lucide-newspaper', label: 'Article', color: 'primary' as const }
    case 'recipes':
      return { icon: 'i-lucide-utensils', label: 'Recette', color: 'warning' as const
      }
    case 'pages':
      return { icon: 'i-lucide-file-text', label: 'Page', color: 'info' as const }
  }
}
</script>

<template>
  <section :class="[DASHBOARD_SURFACE_CLASS, 'flex h-full flex-col']">
    <div class="border-b border-default/70 px-4 py-3">
      <h2 class="text-sm font-semibold text-highlighted">
        À planifier
      </h2>
      <p class="mt-0.5 text-xs text-muted">
        Brouillons les plus récemment modifiés, sans date de publication.
      </p>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto p-3">
      <div
        v-if="items.length === 0"
        class="rounded-lg border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
      >
        Aucun brouillon en attente.
      </div>

      <ul v-else class="space-y-2">
        <li v-for="item in items" :key="`${item.contentType}:${item.id}`">
          <NuxtLink
            :to="item.editPath"
            class="flex items-start gap-2 rounded-md border border-default/80 px-2.5 py-2 transition hover:bg-elevated/60"
          >
            <UIcon :name="typeMeta(item.contentType).icon" class="mt-0.5 size-4 shrink-0 text-dimmed" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-highlighted">
                {{ item.title }}
              </p>
              <p class="mt-0.5 text-xs text-muted">
                {{ typeMeta(item.contentType).label }}
                · modifié {{ new Date(item.updatedAt).toLocaleDateString('fr-FR') }}
              </p>
            </div>
            <UBadge :color="typeMeta(item.contentType).color" variant="subtle" size="sm" class="shrink-0">
              Brouillon
            </UBadge>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <div class="border-t border-default/70 px-4 py-2">
      <UButton
        to="/planning"
        block
        size="sm"
        color="neutral"
        variant="soft"
        icon="i-lucide-calendar-days"
        label="Ouvrir le planning"
      />
    </div>
  </section>
</template>
