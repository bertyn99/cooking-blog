<script setup lang="ts">
import { getApiErrorMessage } from '#shared/api-error'
import {
  MAINTENANCE_PURGE_CONFIRM_PHRASE,
  MAINTENANCE_PURGE_TARGETS,
  type MaintenancePurgeTarget,
  type MaintenanceStatusResponse,
} from '#shared/maintenance'

definePageMeta({ middleware: ['admin'] })

const { $api } = useNuxtApp()
const toast = useToast()
const { loggedIn } = useUserSession()

const selectedTargets = ref<MaintenancePurgeTarget[]>([])
const confirmPhrase = ref('')
const purging = ref(false)
const confirmOpen = ref(false)
const resettingImport = ref(false)

const PURGE_TARGET_META: Record<MaintenancePurgeTarget, { label: string, description: string }> = {
  articles: { label: 'Articles', description: 'SEO, révisions, liens Strapi' },
  recipes: { label: 'Recettes', description: 'Ingrédients, nutrition, avis, SEO' },
  pages: { label: 'Pages CMS', description: 'SEO, révisions, liens Strapi' },
  'category-articles': { label: 'Catégories blog', description: 'Taxonomie articles' },
  categories: { label: 'Catégories recettes', description: 'Images de catégorie' },
  'legacy-media-map': {
    label: 'Cartographie médias Strapi',
    description: 'Liens legacy_strapi_map (médias uniquement, fichiers conservés)',
  },
  'legacy-strapi-map': {
    label: 'Cartographie Strapi complète',
    description: 'Toute la table legacy_strapi_map (réimport propre sans effacer le contenu)',
  },
  media: {
    label: 'Médiathèque',
    description: 'Fichiers R2/local + table blobs + cartographie médias (couvertures détachées)',
  },
}

const {
  data: maintenance,
  refresh,
  error: loadError,
  status: loadStatus,
} = useAsyncData(
  'maintenance-counts',
  () => $api<MaintenanceStatusResponse>('/api/admin/maintenance'),
  {
    server: false,
    /** Wait until session is ready — early fetch returns 401 and stuck UI. */
    immediate: false,
  },
)

async function loadCounts() {
  await refresh()
}

watch(loggedIn, (value) => {
  if (value) void loadCounts()
}, { immediate: true })

const counts = computed(() => maintenance.value?.counts ?? null)
const isLoading = computed(() => loadStatus.value === 'pending')
const hasCounts = computed(() => counts.value != null)

function countFor(target: MaintenancePurgeTarget): number {
  const c = counts.value
  if (!c) return 0
  switch (target) {
    case 'articles':
      return c.articles
    case 'recipes':
      return c.recipes
    case 'pages':
      return c.pages
    case 'category-articles':
      return c.categoryArticles
    case 'categories':
      return c.categories
    case 'legacy-media-map':
      return c.legacyMediaMap
    case 'legacy-strapi-map':
      return c.legacyStrapiMap
    case 'media':
      return c.media
    default: {
      const _exhaustive: never = target
      return _exhaustive
    }
  }
}

const selectedRowTotal = computed(() =>
  selectedTargets.value.reduce((sum, t) => sum + countFor(t), 0),
)

const databaseSourceLabel = computed(() => {
  const source = maintenance.value?.databaseSource
  if (!source) return null
  return source === 'local' ? 'Base locale (.data/db/sqlite.db)' : 'Cloudflare D1'
})

const strapiImportStatus = computed(() => maintenance.value?.strapiImportStatus ?? 'idle')

function isSelected(target: MaintenancePurgeTarget) {
  return selectedTargets.value.includes(target)
}

function toggleTarget(target: MaintenancePurgeTarget, checked: boolean | 'indeterminate') {
  const on = checked === true
  if (on && !isSelected(target)) {
    selectedTargets.value = [...selectedTargets.value, target]
    return
  }
  if (!on) {
    selectedTargets.value = selectedTargets.value.filter(t => t !== target)
  }
}

function selectAllContent() {
  selectedTargets.value = [...MAINTENANCE_PURGE_TARGETS]
}

function requestPurge() {
  if (!selectedTargets.value.length) {
    toast.add({ title: 'Sélectionnez au moins une cible', color: 'warning' })
    return
  }
  confirmOpen.value = true
}

async function resetStrapiImport() {
  resettingImport.value = true
  try {
    await $api('/api/admin/strapi-import/reset', { method: 'POST' })
    await loadCounts()
    toast.add({
      title: 'État d’import Strapi réinitialisé',
      description: 'Verrou et journal d’import effacés.',
      color: 'neutral',
    })
  }
  catch (error) {
    toast.add({
      title: 'Réinitialisation impossible',
      description: getApiErrorMessage(error, 'Échec'),
      color: 'error',
    })
  }
  finally {
    resettingImport.value = false
  }
}

async function executePurge() {
  if (confirmPhrase.value !== MAINTENANCE_PURGE_CONFIRM_PHRASE) {
    toast.add({
      title: 'Confirmation incorrecte',
      description: `Tapez ${MAINTENANCE_PURGE_CONFIRM_PHRASE} pour valider.`,
      color: 'warning',
    })
    return
  }

  purging.value = true
  try {
    const response = await $api<{
      ok: boolean
      message: string
      result: { deleted: Partial<Record<MaintenancePurgeTarget, number>> }
    }>('/api/admin/maintenance/purge', {
      method: 'POST',
      body: {
        targets: selectedTargets.value,
        confirmPhrase: confirmPhrase.value,
      },
    })
    await loadCounts()
    confirmOpen.value = false
    confirmPhrase.value = ''
    selectedTargets.value = []
    toast.add({
      title: 'Maintenance terminée',
      description: response.message,
      color: 'success',
    })
  }
  catch (error) {
    toast.add({
      title: 'Suppression impossible',
      description: getApiErrorMessage(error, 'Échec'),
      color: 'error',
    })
  }
  finally {
    purging.value = false
  }
}
</script>

<template>
  <AppDashboardPanel id="maintenance">
    <template #header>
      <AppDashboardNavbar title="Maintenance" />
    </template>

    <template #body>
      <UAlert
        v-if="loadError"
        color="error"
        variant="subtle"
        title="Impossible de charger les compteurs"
        :description="getApiErrorMessage(loadError, 'Connectez-vous avec un compte administrateur.')"
        class="mb-4"
      >
        <template #actions>
          <UButton size="xs" variant="soft" label="Réessayer" @click="loadCounts()" />
        </template>
      </UAlert>

      <UAlert
        v-else-if="databaseSourceLabel"
        color="neutral"
        variant="subtle"
        title="Source de données"
        :description="databaseSourceLabel"
        class="mb-4"
      />

      <UAlert
        v-if="strapiImportStatus === 'running'"
        color="warning"
        variant="subtle"
        title="Import Strapi en cours ou bloqué"
        description="Si l’import a été interrompu, réinitialisez son état avant d’en relancer un."
        class="mb-4"
      />

      <UPageCard title="Import Strapi" class="mb-6">
        <p class="mb-4 text-sm text-muted">
          Débloque l’écran d’import (verrou KV, journal) sans supprimer le contenu.
        </p>
        <UButton
          variant="outline"
          icon="i-lucide-rotate-ccw"
          label="Réinitialiser l’état d’import"
          :loading="resettingImport"
          @click="resetStrapiImport"
        />
      </UPageCard>

      <UAlert
        color="warning"
        variant="subtle"
        title="Zone destructive"
        description="Supprime définitivement les données sélectionnées. L’option « Médiathèque » efface aussi les fichiers sur R2 ou dans .data/media."
        class="mb-6"
      />

      <UPageCard title="Vider des collections">
        <div class="mb-4 flex flex-wrap gap-2">
          <UButton size="sm" variant="outline" label="Tout sélectionner" @click="selectAllContent" />
          <UButton
            size="sm"
            variant="ghost"
            icon="i-lucide-refresh-cw"
            label="Actualiser"
            :loading="isLoading"
            @click="loadCounts()"
          />
        </div>

        <fieldset class="mb-4 space-y-2">
          <legend class="mb-2 text-sm font-medium text-default">
            Cibles
          </legend>

          <div
            v-for="target in MAINTENANCE_PURGE_TARGETS"
            :key="target"
            class="flex items-start gap-3 rounded-lg border border-default p-3"
          >
            <UCheckbox
              :model-value="isSelected(target)"
              :aria-label="PURGE_TARGET_META[target].label"
              @update:model-value="(v) => toggleTarget(target, v)"
            />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-medium text-default">
                  {{ PURGE_TARGET_META[target].label }}
                </span>
                <UBadge
                  v-if="isLoading && !hasCounts"
                  color="neutral"
                  variant="subtle"
                  label="…"
                />
                <UBadge
                  v-else
                  :color="countFor(target) > 0 ? 'warning' : 'neutral'"
                  variant="subtle"
                  :label="String(countFor(target))"
                />
              </div>
              <p class="mt-0.5 text-sm text-muted">
                {{ PURGE_TARGET_META[target].description }}
              </p>
            </div>
          </div>
        </fieldset>

        <p class="mb-4 text-sm text-muted">
          Ordre appliqué côté serveur : articles → recettes → pages → catégories blog → catégories recettes →
          cartographie médias → cartographie Strapi complète → médiathèque (fichiers).
          <span v-if="selectedTargets.length">
            Sélection : environ <strong>{{ selectedRowTotal }}</strong> entrée(s) concernée(s).
          </span>
        </p>

        <UButton
          color="error"
          icon="i-lucide-trash-2"
          label="Supprimer la sélection…"
          :disabled="!selectedTargets.length || purging || isLoading"
          @click="requestPurge"
        />
      </UPageCard>

      <UModal v-model:open="confirmOpen" title="Confirmer la suppression">
        <template #body>
          <p class="mb-4 text-sm text-muted">
            Cette action est irréversible pour les lignes sélectionnées (~{{ selectedRowTotal }} entrée(s)).
          </p>
          <UFormField :label="`Saisir ${MAINTENANCE_PURGE_CONFIRM_PHRASE} pour confirmer`">
            <UInput v-model="confirmPhrase" :placeholder="MAINTENANCE_PURGE_CONFIRM_PHRASE" />
          </UFormField>
        </template>
        <template #footer>
          <UButton variant="outline" label="Annuler" @click="confirmOpen = false" />
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            label="Supprimer"
            :loading="purging"
            @click="executePurge"
          />
        </template>
      </UModal>
    </template>
  </AppDashboardPanel>
</template>
