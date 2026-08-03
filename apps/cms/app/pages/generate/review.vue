<script setup lang="ts">
import { GENERATION_RUN_STATUS_LABELS } from '~/types/generation'
import { useGenerationReviewInbox } from '~/composables/useGenerationComposer'

const { runs, count, grouped, pending, error, refresh } = useGenerationReviewInbox()

function kindLabel(targetType: 'article' | 'recipe') {
  return targetType === 'recipe' ? 'Recette' : 'Article'
}
</script>

<template>
  <AppDashboardPanel id="generate-review">
    <template #header>
      <AppDashboardNavbar title="Inbox relecture">
        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              :loading="pending"
              @click="refresh"
            >
              Actualiser
            </UButton>
            <UButton
              to="/generate"
              color="neutral"
              variant="outline"
              icon="i-lucide-plus"
            >
              Nouveau
            </UButton>
          </div>
        </template>
      </AppDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto max-w-3xl space-y-6">
        <UAlert
          color="info"
          variant="subtle"
          title="Relecture croisée"
          :description="`Runs à relire (hors les vôtres) : ${count}. Les enfants d’un ebook sont regroupés.`"
        />

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          title="Impossible de charger l’inbox"
        />

        <div
          v-if="pending && !runs.length"
          class="flex justify-center py-12"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="size-8 animate-spin text-muted"
          />
        </div>

        <UPageCard
          v-else-if="!runs.length"
          title="Rien à relire"
        >
          <p class="text-sm text-muted">
            Aucun run en attente de relecture pour le moment.
          </p>
        </UPageCard>

        <div
          v-else
          class="space-y-6"
        >
          <section
            v-for="[parentId, childRuns] in grouped.byParent"
            :key="parentId"
            class="space-y-2"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-medium text-highlighted">
                Ebook · {{ childRuns.length }} run{{ childRuns.length > 1 ? 's' : '' }}
              </p>
              <NuxtLink
                :to="`/generate/${parentId}`"
                class="text-xs text-muted underline"
              >
                Voir le parent
              </NuxtLink>
            </div>
            <ul class="space-y-2 border-l-2 border-primary/30 pl-3">
              <li
                v-for="run in childRuns"
                :key="run.id"
              >
                <NuxtLink
                  :to="`/generate/${run.id}`"
                  class="block rounded-lg border border-default/60 px-4 py-3 transition hover:bg-elevated/50"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="min-w-0 space-y-1">
                      <p class="font-medium text-highlighted">
                        {{ kindLabel(run.targetType) }}
                        <span
                          v-if="run.reviewRound"
                          class="text-muted font-normal"
                        >
                          · porte {{ run.reviewRound }}
                        </span>
                      </p>
                      <p class="font-mono text-xs text-muted truncate">
                        {{ run.id }}
                      </p>
                    </div>
                    <UBadge
                      color="warning"
                      variant="subtle"
                    >
                      {{ GENERATION_RUN_STATUS_LABELS[run.status] }}
                    </UBadge>
                  </div>
                </NuxtLink>
              </li>
            </ul>
          </section>

          <ul
            v-if="grouped.orphans.length"
            class="space-y-3"
          >
            <li
              v-for="run in grouped.orphans"
              :key="run.id"
            >
              <NuxtLink
                :to="`/generate/${run.id}`"
                class="block rounded-lg border border-default/60 px-4 py-3 transition hover:bg-elevated/50"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="min-w-0 space-y-1">
                    <p class="font-medium text-highlighted">
                      {{ kindLabel(run.targetType) }}
                      <span
                        v-if="run.reviewRound"
                        class="text-muted font-normal"
                      >
                        · porte {{ run.reviewRound }}
                      </span>
                    </p>
                    <p class="font-mono text-xs text-muted truncate">
                      {{ run.id }}
                    </p>
                  </div>
                  <UBadge
                    color="warning"
                    variant="subtle"
                  >
                    {{ GENERATION_RUN_STATUS_LABELS[run.status] }}
                  </UBadge>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </AppDashboardPanel>
</template>
