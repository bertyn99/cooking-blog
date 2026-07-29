<script setup lang="ts">
import type { CheckboxGroupItem } from '@nuxt/ui'
import { getApiErrorMessage } from '#shared/api-error'
import {
  MAINTENANCE_PURGE_CONFIRM_PHRASE,
  MAINTENANCE_PURGE_TARGETS,
  type MaintenanceCounts,
  type MaintenancePurgeTarget,
} from '#shared/maintenance'

definePageMeta({ middleware: ['admin'] })

const { $api } = useNuxtApp()
const toast = useToast()
const { loggedIn } = useUserSession()

const selectedTargets = ref<MaintenancePurgeTarget[]>([])
const confirmPhrase = ref('')
const purging = ref(false)
const confirmOpen = ref(false)

const purgeItems: CheckboxGroupItem[] = [
  { value: 'articles', label: 'Articles', description: 'SEO, révisions, liens Strapi' },
  { value: 'recipes', label: 'Recettes', description: 'Ingrédients, nutrition, avis, SEO' },
  { value: 'pages', label: 'Pages CMS', description: 'SEO, révisions, liens Strapi' },
  { value: 'category-articles', label: 'Catégories blog', description: 'Taxonomie articles' },
  { value: 'categories', label: 'Catégories recettes', description: 'Images de catégorie' },
  {
    value: 'legacy-media-map',
    label: 'Cartographie médias Strapi',
    description: 'Liens legacy_strapi_map uniquement (fichiers conservés)',
  },
  {
    value: 'media',
    label: 'Médiathèque',
    description: 'Fichiers R2/local + table blobs + cartographie Strapi (couvertures détachées)',
  },
]

const {
  data: maintenance,
  refresh,
  error: loadError,
} = useAsyncData(
  'maintenance-counts',
  () => $api<{ counts: MaintenanceCounts }>('/api/admin/maintenance'),
  { server: false },
)

watch(loggedIn, (value) => {
  if (value) void refresh()
}, { immediate: true })

const counts = computed(() => maintenance.value?.counts)

const countByTarget = computed((): Record<MaintenancePurgeTarget, number> => ({
  articles: counts.value?.articles ?? 0,
  recipes: counts.value?.recipes ?? 0,
  pages: counts.value?.pages ?? 0,
  'category-articles': counts.value?.categoryArticles ?? 0,
  categories: counts.value?.categories ?? 0,
  'legacy-media-map': counts.value?.legacyMediaMap ?? 0,
  media: counts.value?.media ?? 0,
}))

const purgeCheckboxItems = computed(() =>
  purgeItems.map((item) => {
    const target = item.value as MaintenancePurgeTarget
    const n = countByTarget.value[target] ?? 0
    return {
      ...item,
      label: `${item.label} (${n})`,
    }
  }),
)

const selectedRowTotal = computed(() =>
  selectedTargets.value.reduce((sum, t) => sum + (countByTarget.value[t] ?? 0), 0),
)

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
    await refresh()
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
      <UAlert v-if="loadError" color="error" variant="subtle" title="Impossible de charger les compteurs"
        description="Connectez-vous avec un compte administrateur." class="mb-4" />

      <UAlert color="warning" variant="subtle" title="Zone destructive"
        description="Supprime définitivement les données sélectionnées. L’option « Médiathèque » efface aussi les fichiers sur R2 ou dans .data/media."
        class="mb-6" />

      <UPageCard title="Vider des collections">
        <div class="mb-4 flex flex-wrap gap-2">
          <UButton size="sm" variant="outline" label="Tout sélectionner" @click="selectAllContent" />
          <UButton size="sm" variant="ghost" icon="i-lucide-refresh-cw" label="Actualiser" @click="refresh()" />
        </div>

        <UCheckboxGroup v-model="selectedTargets" legend="Cibles" variant="card" :items="purgeCheckboxItems"
          class="mb-4" />

        <p class="mb-4 text-sm text-muted">
          Ordre appliqué côté serveur : articles → recettes → pages → catégories blog → catégories recettes →
          cartographie médias → médiathèque (fichiers).
          <span v-if="selectedTargets.length">
            Sélection : environ <strong>{{ selectedRowTotal }}</strong> entrée(s) concernée(s).
          </span>
        </p>

        <UButton color="error" icon="i-lucide-trash-2" label="Supprimer la sélection…"
          :disabled="!selectedTargets.length || purging" @click="requestPurge" />
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
          <UButton color="error" icon="i-lucide-trash-2" label="Supprimer" :loading="purging" @click="executePurge" />
        </template>
      </UModal>
    </template>
  </AppDashboardPanel>
</template>
