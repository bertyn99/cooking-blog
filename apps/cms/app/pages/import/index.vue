<script setup lang="ts">
import { STRAPI_IMPORT_STEPS, type StrapiImportStep } from '#shared/strapi-import'

definePageMeta({ middleware: ['admin'] })
import {
  STRAPI_IMPORT_STEP_ITEMS,
  formatStepCoverageHintForItem,
  useStrapiImportPanel,
} from '~/composables/useStrapiImportPanel'

const selectedSteps = ref<StrapiImportStep[]>(['category-articles', 'categories'])
const dryRun = ref(true)

const {
  config,
  configError,
  refresh,
  refreshConnection,
  resetImportState,
  confirmOpen,
  importStatus,
  isSubmitting,
  isRemoteImportRunning,
  isLaunchBusy,
  reachabilityBadge,
  statusBadgeColor,
  requestImport,
  requestTargetedImport,
  executeImport,
} = useStrapiImportPanel({ selectedSteps, dryRun })

const testTarget = ref<'article' | 'recipe' | 'page'>('article')
const testSlug = ref('')
const testLocale = ref('fr')

const testTargetItems = [
  { value: 'article', label: 'Article (blog)' },
  { value: 'recipe', label: 'Recette' },
  { value: 'page', label: 'Page CMS' },
] as const

const configLoadFailed = computed(() => Boolean(configError.value))

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
  <AppDashboardPanel id="strapi-import">
    <template #header>
      <AppDashboardNavbar title="Import Strapi" />
    </template>

    <template #body>
      <UAlert v-if="configLoadFailed" color="error" variant="subtle"
        title="Impossible de charger la configuration d’import"
        description="Connectez-vous avec un compte administrateur, puis rechargez la page." class="mb-4" />
      <UAlert v-else-if="isRemoteImportRunning" color="warning" variant="subtle" title="Import en cours"
        description="Un import est déjà en cours côté serveur. Suivez le journal ci-dessous ou utilisez « Réinitialiser l’état » s’il est bloqué."
        class="mb-4" />

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
            <UButton size="sm" variant="outline" icon="i-lucide-plug" label="Tester Strapi" :disabled="isSubmitting"
              @click="refreshConnection()" />
            <UButton size="sm" variant="ghost" color="warning" icon="i-lucide-rotate-ccw" label="Réinitialiser l’état"
              @click="resetImportState()" />
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
              <UBadge v-for="step in STRAPI_IMPORT_STEPS" :key="step"
                :color="coverageBadgeColor(config.stepCoverage[step]?.state)" variant="subtle">
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
          <UCheckboxGroup v-model="selectedSteps" legend="Étapes" variant="card" :items="stepCheckboxItems"
            class="mb-4" />

          <UCheckbox v-model="dryRun" variant="list" label="Simulation (dry-run)"
            description="Interroge Strapi et affiche les statistiques sans écrire en base ni copier les fichiers."
            class="mb-6" />

          <div class="flex flex-wrap gap-3">
            <UButton icon="i-lucide-download" :label="dryRun ? 'Lancer la simulation' : 'Importer depuis Strapi'"
              :loading="isLaunchBusy" :disabled="isSubmitting" @click="requestImport" />
            <UButton variant="outline" icon="i-lucide-refresh-cw" label="Journal" @click="refresh()" />
          </div>

          <p class="mt-4 text-xs text-muted">
            Compte <strong>admin</strong> requis. En dev local, l’import s’exécute jusqu’au bout dans la
            même requête (le bouton reste en chargement le temps du traitement).
          </p>
        </UPageCard>
      </div>

      <UPageCard title="Import ciblé (test)" class="mt-6">
        <p class="mb-4 text-sm text-muted">
          Importe un seul contenu Strapi par <strong>slug</strong> (sans ré-importer toutes les catégories).
          Les taxonomies doivent déjà être en base si le contenu y fait référence.
        </p>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UFormField label="Type">
            <USelect v-model="testTarget" :items="[...testTargetItems]" class="w-full" />
          </UFormField>
          <UFormField label="Slug Strapi" class="sm:col-span-2">
            <UInput v-model="testSlug" placeholder="mon-article" />
          </UFormField>
          <UFormField label="Locale">
            <UInput v-model="testLocale" placeholder="fr" />
          </UFormField>
        </div>
        <div class="mt-4 flex flex-wrap gap-3">
          <UButton variant="outline" icon="i-lucide-crosshair"
            :label="dryRun ? 'Tester ce slug (simulation)' : 'Importer ce slug'" :loading="isLaunchBusy"
            :disabled="isSubmitting" @click="requestTargetedImport(testTarget, testSlug, testLocale)" />
        </div>
      </UPageCard>

      <UPageCard v-if="lastResult" title="Dernier résultat" class="mt-6">
        <p class="mb-3 text-xs text-muted">
          « Catégories blog » → menu Taxonomie / Catégories (type Blog). « Catégories recettes » → même page (type
          Recette).
          Les articles n’apparaissent qu’après l’étape <strong>Articles</strong>.
        </p>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="(stats, step) in lastResult.steps" v-show="stats" :key="step"
            class="rounded-lg border border-default p-3 text-sm">
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
          <UBadge v-if="importStatus" :color="statusBadgeColor" variant="subtle">
            {{ importStatus.status }}
          </UBadge>
          <span v-if="importStatus?.currentStep" class="text-xs text-muted">
            {{ importStatus.currentStep }}
          </span>
          <span v-if="importStatus?.startedAt" class="text-xs text-muted">
            Démarré {{ importStatus.startedAt }}
          </span>
        </div>

        <ul
          class="max-h-80 space-y-1 overflow-y-auto rounded-lg border border-default bg-elevated/30 p-3 font-mono text-xs">
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
          <UButton color="warning" icon="i-lucide-download" label="Importer" :loading="isLaunchBusy"
            :disabled="isSubmitting" @click="executeImport" />
        </template>
      </UModal>
    </template>
  </AppDashboardPanel>
</template>
