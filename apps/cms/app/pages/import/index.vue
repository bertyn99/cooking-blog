<script setup lang="ts">
import { STRAPI_IMPORT_STEPS, type StrapiImportStep } from '#shared/strapi-import'
import {
  STRAPI_IMPORT_STEP_ITEMS,
  formatStepCoverageHintForItem,
  useStrapiImportPanel,
} from '~/composables/useStrapiImportPanel'

const selectedSteps = ref<StrapiImportStep[]>(
  STRAPI_IMPORT_STEP_ITEMS.map(item => item.value as StrapiImportStep),
)
const dryRun = ref(true)

const {
  config,
  refresh,
  refreshConnection,
  resetImportState,
  confirmOpen,
  importStatus,
  isLaunching,
  reachabilityBadge,
  statusBadgeColor,
  requestImport,
  executeImport,
} = useStrapiImportPanel({ selectedSteps, dryRun })

const lastResult = computed(() => importStatus.value?.result)

const stepCheckboxItems = computed(() =>
  STRAPI_IMPORT_STEP_ITEMS.map((item) => {
    const step = item.value as StrapiImportStep
    const syncHint = formatStepCoverageHintForItem(step, config.value ?? null)
    const coverage = config.value?.stepCoverage?.[step]
    const labelSuffix = coverage?.state === 'synced' ? ' ✓' : ''
    return {
      ...item,
      label: `${item.label}${labelSuffix}`,
      description: syncHint
        ? `${item.description} — ${syncHint}`
        : item.description,
    }
  }),
)

function coverageBadgeColor(state: string | undefined) {
  if (state === 'synced') return 'success' as const
  if (state === 'partial') return 'warning' as const
  if (state === 'unknown') return 'neutral' as const
  return 'neutral' as const
}
</script>

<template>
  <UDashboardPanel id="strapi-import">
    <template #header>
      <UDashboardNavbar title="Import Strapi">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid gap-6 lg:grid-cols-2">
        <UPageCard title="Source Strapi">
          <dl class="space-y-3 text-sm">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <dt class="text-muted">
                URL
              </dt>
              <dd class="font-mono text-xs text-highlighted">
                {{ config?.strapiUrl || '—' }}
              </dd>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <dt class="text-muted">
                Jeton API
              </dt>
              <dd>
                <UBadge :color="config?.hasStrapiToken ? 'success' : 'warning'" variant="subtle">
                  {{ config?.hasStrapiToken ? 'Configuré' : 'Non requis (API publique)' }}
                </UBadge>
              </dd>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <dt class="text-muted">
                Connexion
              </dt>
              <dd class="flex items-center gap-2">
                <UBadge :color="reachabilityBadge.color" variant="subtle">
                  {{ reachabilityBadge.label }}
                </UBadge>
                <span v-if="config?.strapiArticleCount != null" class="text-muted">
                  {{ config.strapiArticleCount }} articles
                </span>
              </dd>
            </div>
          </dl>

          <div class="mt-4 flex flex-wrap gap-2">
            <UButton
              size="sm"
              variant="outline"
              icon="i-lucide-plug"
              label="Tester Strapi"
              :disabled="isLaunching"
              @click="refreshConnection()"
            />
            <UButton
              size="sm"
              variant="ghost"
              color="warning"
              icon="i-lucide-rotate-ccw"
              label="Réinitialiser l’état"
              @click="resetImportState()"
            />
          </div>

          <p class="mt-4 text-sm text-muted">
            Les médias Strapi (<code class="text-xs">/uploads/…</code>) sont copiés vers le stockage CMS
            (R2 ou dossier local) lors de l’import du contenu. Les imports sont idempotents via
            <code class="text-xs">legacy_strapi_map</code>.
          </p>

          <div v-if="config?.stepCoverage" class="mt-4">
            <p class="mb-2 text-xs font-medium text-muted">
              Déjà en base (liens Strapi)
            </p>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="step in STRAPI_IMPORT_STEPS"
                :key="step"
                :color="coverageBadgeColor(config.stepCoverage[step]?.state)"
                variant="subtle"
              >
                {{ step }}:
                {{ config.stepCoverage[step]?.mappedCount ?? 0 }}
                <template v-if="config.stepCoverage[step]?.strapiTotal != null">
                  / {{ config.stepCoverage[step]?.strapiTotal }}
                </template>
              </UBadge>
            </div>
          </div>
        </UPageCard>

        <UPageCard title="Options d’import">
          <UCheckboxGroup
            v-model="selectedSteps"
            legend="Étapes"
            variant="card"
            :items="stepCheckboxItems"
            class="mb-4"
          />

          <UCheckbox
            v-model="dryRun"
            variant="list"
            label="Simulation (dry-run)"
            description="Interroge Strapi et affiche les statistiques sans écrire en base ni copier les fichiers."
            class="mb-6"
          />

          <div class="flex flex-wrap gap-3">
            <UButton
              icon="i-lucide-download"
              :label="dryRun ? 'Lancer la simulation' : 'Importer depuis Strapi'"
              :loading="isLaunching"
              :disabled="isLaunching"
              @click="requestImport"
            />
            <UButton
              variant="outline"
              icon="i-lucide-refresh-cw"
              label="Journal"
              @click="refresh()"
            />
          </div>

          <p class="mt-4 text-xs text-muted">
            Compte <strong>admin</strong> requis. En dev local, l’import s’exécute jusqu’au bout dans la
            même requête (le bouton reste en chargement le temps du traitement).
          </p>
        </UPageCard>
      </div>

      <UPageCard v-if="lastResult" title="Dernier résultat" class="mt-6">
        <p class="mb-3 text-xs text-muted">
          « Catégories blog » → menu Taxonomie / Catégories (type Blog). « Catégories recettes » → même page (type Recette).
          Les articles n’apparaissent qu’après l’étape <strong>Articles</strong>.
        </p>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(stats, step) in lastResult.steps"
            v-show="stats"
            :key="step"
            class="rounded-lg border border-default p-3 text-sm"
          >
            <template v-if="stats">
            <p class="font-medium text-highlighted">
              {{ step }}
            </p>
            <p class="mt-1 text-muted">
              <template v-if="stats.created === 0 && stats.updated === 0 && stats.skipped > 0 && !stats.errors">
                Déjà synchronisé — {{ stats.skipped }} inchangé(s)
              </template>
              <template v-else>
                +{{ stats.created }} / ~{{ stats.updated }} / ⊘{{ stats.skipped }}
                <span v-if="stats.errors" class="text-error"> / !{{ stats.errors }}</span>
              </template>
            </p>
            </template>
          </div>
        </div>
        <p class="mt-3 text-xs text-muted">
          Médias : +{{ lastResult.media.created }} créés, {{ lastResult.media.skipped }} ignorés,
          {{ lastResult.media.errors }} erreurs
        </p>
      </UPageCard>

      <UPageCard title="Journal" class="mt-6">
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <UBadge
            v-if="importStatus"
            :color="statusBadgeColor"
            variant="subtle"
          >
            {{ importStatus.status }}
          </UBadge>
          <span v-if="importStatus?.currentStep" class="text-xs text-muted">
            {{ importStatus.currentStep }}
          </span>
          <span v-if="importStatus?.startedAt" class="text-xs text-muted">
            Démarré {{ importStatus.startedAt }}
          </span>
        </div>

        <ul class="max-h-80 space-y-1 overflow-y-auto rounded-lg border border-default bg-elevated/30 p-3 font-mono text-xs">
          <li v-for="(line, index) in importStatus?.messages ?? []" :key="index" class="text-muted">
            {{ line }}
          </li>
          <li v-if="!(importStatus?.messages?.length)" class="text-dimmed">
            Aucun import lancé pour le moment.
          </li>
        </ul>

        <p v-if="importStatus?.error" class="mt-3 text-sm text-error">
          {{ importStatus.error }}
        </p>
      </UPageCard>

      <UModal v-model:open="confirmOpen" title="Confirmer l’import">
        <template #body>
          <p class="text-sm text-muted">
            Cette action écrit en base de données et copie les fichiers médias depuis Strapi.
            Les entrées existantes seront mises à jour (idempotent).
          </p>
        </template>
        <template #footer>
          <UButton variant="outline" label="Annuler" @click="confirmOpen = false" />
          <UButton
            color="warning"
            icon="i-lucide-download"
            label="Importer"
            :loading="isLaunching"
            @click="executeImport"
          />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
