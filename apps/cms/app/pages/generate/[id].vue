<script setup lang="ts">
import { GENERATION_RUN_STATUS_LABELS } from '~/types/generation'
import { useGenerationRun } from '~/composables/useGenerationComposer'

const route = useRoute()
const runId = computed(() => String(route.params.id))

const {
  run,
  children,
  discover,
  progress,
  runPending,
  runError,
  isBusy,
  canApprove,
  canRequestChanges,
  canSelectCandidates,
  isSelfRequester,
  contentEditPath,
  reviewNote,
  reviewing,
  selecting,
  refreshAll,
  approve,
  reject,
  requestChanges,
  selectCandidates,
} = useGenerationRun(runId)

const title = computed(() => {
  if (!run.value) return 'Run de génération'
  if (run.value.runKind === 'batch') {
    return `Ebook · ${GENERATION_RUN_STATUS_LABELS[run.value.status]}`
  }
  const kind = run.value.targetType === 'recipe' ? 'Recette' : 'Article'
  return `${kind} · ${GENERATION_RUN_STATUS_LABELS[run.value.status]}`
})

const gateLabel = computed(() => {
  const round = run.value?.reviewRound
  if (!round || round < 1) return null
  return `Porte ${round}`
})
</script>

<template>
  <AppDashboardPanel id="generate-run">
    <template #header>
      <AppDashboardNavbar :title="title">
        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              :loading="runPending"
              @click="refreshAll"
            >
              Actualiser
            </UButton>
            <UButton
              to="/generate/review"
              color="neutral"
              variant="ghost"
              icon="i-lucide-inbox"
            >
              Inbox
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
          v-if="runError"
          color="error"
          variant="subtle"
          title="Run introuvable"
          description="Vérifiez l’identifiant ou relancez une génération."
        />

        <div
          v-else-if="runPending && !run"
          class="flex justify-center py-12"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="size-8 animate-spin text-muted"
          />
        </div>

        <template v-else-if="run">
          <UAlert
            v-if="isBusy"
            color="info"
            variant="subtle"
            :title="run.status === 'revising' ? 'Révision en cours' : 'Génération en cours'"
            description="L’agent lit la source et peut appeler les outils SEO. Cette page se met à jour automatiquement."
          />

          <UPageCard title="Progression">
            <div
              v-if="gateLabel"
              class="mb-3"
            >
              <UBadge
                color="warning"
                variant="subtle"
              >
                {{ gateLabel }}
              </UBadge>
            </div>
            <GenerationRunStatus
              :run="run"
              :progress="progress"
            />
          </UPageCard>

          <UPageCard
            v-if="canSelectCandidates && discover?.candidates?.length"
            title="Candidats détectés"
          >
            <p class="mb-4 text-sm text-muted">
              Un ebook peut contenir plusieurs recettes ou articles. Sélectionnez ceux à générer.
            </p>
            <GenerationCandidatePicker
              :candidates="discover.candidates"
              :loading="selecting"
              @select="selectCandidates"
            />
          </UPageCard>

          <UPageCard
            v-else-if="run.runKind === 'batch' && run.status === 'awaiting_selection'"
            title="Candidats"
          >
            <p class="text-sm text-muted">
              Aucun candidat détecté pour l’instant — vérifiez le découpage des titres dans le texte source.
            </p>
          </UPageCard>

          <UPageCard
            v-if="children.length"
            title="Runs enfants"
          >
            <ul class="space-y-2">
              <li
                v-for="child in children"
                :key="child.id"
              >
                <NuxtLink
                  :to="`/generate/${child.id}`"
                  class="flex items-center justify-between gap-3 rounded-lg border border-default/60 px-3 py-2 hover:bg-elevated/40"
                >
                  <span class="text-sm font-medium">
                    {{ child.targetType === 'recipe' ? 'Recette' : 'Article' }}
                    · {{ GENERATION_RUN_STATUS_LABELS[child.status] }}
                  </span>
                  <span class="font-mono text-xs text-muted truncate">
                    {{ child.id.slice(0, 8) }}…
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </UPageCard>

          <UPageCard
            v-if="contentEditPath || run.status === 'awaiting_review' || run.status === 'approved' || run.status === 'rejected'"
            title="Brouillon"
          >
            <div class="space-y-4">
              <p
                v-if="contentEditPath"
                class="text-sm text-muted"
              >
                Un brouillon a été assemblé. Relisez-le avant publication.
              </p>
              <p
                v-else-if="run.runKind !== 'batch'"
                class="text-sm text-muted"
              >
                Le brouillon apparaîtra ici dès l’étape d’assemblage.
              </p>

              <div class="flex flex-wrap gap-2">
                <UButton
                  v-if="contentEditPath"
                  :to="contentEditPath"
                  icon="i-lucide-pencil"
                >
                  Ouvrir le brouillon
                </UButton>
              </div>

              <USeparator v-if="run.status === 'awaiting_review'" />

              <div
                v-if="run.status === 'awaiting_review'"
                class="space-y-3"
              >
                <UAlert
                  v-if="isSelfRequester && !canApprove"
                  color="warning"
                  variant="subtle"
                  title="Relecture croisée"
                  description="Vous avez lancé ce run — un autre éditeur ou admin doit l’approuver."
                />

                <UFormField
                  label="Note de relecture"
                  :hint="canRequestChanges ? 'Requis pour demander des corrections' : 'Optionnel (requis pour rejeter)'"
                >
                  <UTextarea
                    v-model="reviewNote"
                    :rows="3"
                    :disabled="!canApprove"
                    placeholder="Points à corriger, ton, SEO, structure…"
                  />
                </UFormField>

                <div class="flex flex-wrap gap-2">
                  <UButton
                    icon="i-lucide-check"
                    color="success"
                    :loading="reviewing"
                    :disabled="!canApprove || reviewing"
                    @click="approve"
                  >
                    Approuver
                  </UButton>
                  <UButton
                    v-if="canRequestChanges"
                    icon="i-lucide-refresh-cw"
                    color="warning"
                    variant="soft"
                    :loading="reviewing"
                    :disabled="!canApprove || reviewing"
                    @click="requestChanges"
                  >
                    Demander des corrections
                  </UButton>
                  <UButton
                    icon="i-lucide-x"
                    color="error"
                    variant="outline"
                    :loading="reviewing"
                    :disabled="!canApprove || reviewing"
                    @click="reject"
                  >
                    Rejeter
                  </UButton>
                </div>
              </div>

              <UAlert
                v-else-if="run.status === 'approved'"
                color="success"
                variant="subtle"
                title="Run approuvé"
                :description="run.reviewNote || 'Prêt pour la publication (admin).'"
              />

              <UAlert
                v-else-if="run.status === 'rejected'"
                color="error"
                variant="subtle"
                title="Run rejeté"
                :description="run.reviewNote || 'Le brouillon reste en brouillon.'"
              />
            </div>
          </UPageCard>

          <p class="font-mono text-xs text-muted">
            Run {{ run.id }}
            <template v-if="run.parentRunId">
              · parent
              <NuxtLink
                :to="`/generate/${run.parentRunId}`"
                class="underline"
              >
                {{ run.parentRunId.slice(0, 8) }}…
              </NuxtLink>
            </template>
          </p>
        </template>
      </div>
    </template>
  </AppDashboardPanel>
</template>
