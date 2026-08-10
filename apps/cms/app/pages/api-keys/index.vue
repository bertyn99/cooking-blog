<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { API_KEY_SCOPES, API_KEY_SCOPE_LABELS, type ApiKeyScope } from '#shared/api-keys'
import { TRANSFER_PULL_CONFIRM_PHRASE } from '#shared/transfer-pull'
import { getApiErrorMessage } from '#shared/api-error'
import { DASHBOARD_TABLE_UI } from '~/utils/dashboard-shell'

definePageMeta({
  middleware: ['admin'],
})

type ApiKeyPublic = {
  id: number
  name: string
  keyPrefix: string
  scopes: ApiKeyScope[]
  expiresAt: string | null
  revokedAt: string | null
  lastUsedAt: string | null
  createdAt: string
}

type PullResult = {
  origin: string
  dryRun: boolean
  scopes: ApiKeyScope[]
  counts: Record<string, number>
}

const { $api } = useNuxtApp()
const toast = useToast()

const { data, status, refresh } = await useAsyncData(
  'admin-api-keys',
  () => $api<{ data: ApiKeyPublic[] }>('/api/admin/api-keys', {
    query: { includeRevoked: '1' },
  }),
)

const rows = computed(() => data.value?.data ?? [])

const createOpen = ref(false)
const createLoading = ref(false)
const secretOpen = ref(false)
const createdSecret = ref('')
const pullLoading = ref(false)
const pullResult = ref<PullResult | null>(null)

const createForm = reactive({
  name: '',
  scopes: [] as ApiKeyScope[],
  expiresAt: '',
})

const pullForm = reactive({
  origin: '',
  apiKey: '',
  scopes: [...API_KEY_SCOPES] as ApiKeyScope[],
  dryRun: true,
  confirm: '',
})

const scopeItems = API_KEY_SCOPES.map(scope => ({
  label: API_KEY_SCOPE_LABELS[scope],
  value: scope,
}))

const columns: TableColumn<ApiKeyPublic>[] = [
  { accessorKey: 'name', header: 'Nom' },
  { accessorKey: 'keyPrefix', header: 'Préfixe' },
  {
    accessorKey: 'scopes',
    header: 'Droits',
    cell: ({ row }) => row.original.scopes.join(', '),
  },
  {
    accessorKey: 'lastUsedAt',
    header: 'Dernier usage',
    cell: ({ row }) => row.original.lastUsedAt
      ? new Date(row.original.lastUsedAt).toLocaleString('fr-FR')
      : '—',
  },
  {
    accessorKey: 'revokedAt',
    header: 'Statut',
    cell: ({ row }) => row.original.revokedAt ? 'Révoquée' : 'Active',
  },
  { id: 'actions', header: 'Actions' },
]

async function createKey() {
  if (!createForm.name.trim() || createForm.scopes.length === 0) {
    toast.add({
      title: 'Formulaire incomplet',
      description: 'Nom et au moins un droit sont requis.',
      color: 'warning',
    })
    return
  }
  createLoading.value = true
  try {
    const result = await $api<{ data: ApiKeyPublic, secret: string }>('/api/admin/api-keys', {
      method: 'POST',
      body: {
        name: createForm.name.trim(),
        scopes: createForm.scopes,
        expiresAt: createForm.expiresAt || null,
      },
    })
    createdSecret.value = result.secret
    createOpen.value = false
    secretOpen.value = true
    createForm.name = ''
    createForm.scopes = []
    createForm.expiresAt = ''
    await refresh()
  }
  catch (error) {
    toast.add({
      title: 'Création impossible',
      description: getApiErrorMessage(error),
      color: 'error',
    })
  }
  finally {
    createLoading.value = false
  }
}

async function revokeKey(row: ApiKeyPublic) {
  if (row.revokedAt) return
  try {
    await $api(`/api/admin/api-keys/${row.id}`, { method: 'DELETE' })
    toast.add({ title: 'Clé révoquée', color: 'success' })
    await refresh()
  }
  catch (error) {
    toast.add({
      title: 'Révocation impossible',
      description: getApiErrorMessage(error),
      color: 'error',
    })
  }
}

async function copySecret() {
  await navigator.clipboard.writeText(createdSecret.value)
  toast.add({ title: 'Secret copié', color: 'success' })
}

async function runPull() {
  if (!pullForm.origin.trim() || !pullForm.apiKey.trim() || pullForm.scopes.length === 0) {
    toast.add({
      title: 'Formulaire incomplet',
      description: 'URL d’origine, clé API et au moins un droit sont requis.',
      color: 'warning',
    })
    return
  }
  if (!pullForm.dryRun && pullForm.confirm !== TRANSFER_PULL_CONFIRM_PHRASE) {
    toast.add({
      title: 'Confirmation requise',
      description: `Saisissez « ${TRANSFER_PULL_CONFIRM_PHRASE} » pour écrire dans cette instance.`,
      color: 'warning',
    })
    return
  }

  pullLoading.value = true
  pullResult.value = null
  try {
    const result = await $api<{ data: PullResult }>('/api/admin/transfer/pull', {
      method: 'POST',
      body: {
        origin: pullForm.origin.trim(),
        apiKey: pullForm.apiKey.trim(),
        scopes: pullForm.scopes,
        dryRun: pullForm.dryRun,
        confirm: pullForm.confirm,
      },
    })
    pullResult.value = result.data
    toast.add({
      title: pullForm.dryRun ? 'Simulation terminée' : 'Import terminé',
      description: Object.entries(result.data.counts)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' · ') || 'Aucun élément',
      color: 'success',
    })
    if (!pullForm.dryRun) {
      pullForm.apiKey = ''
      pullForm.confirm = ''
    }
  }
  catch (error) {
    toast.add({
      title: 'Pull impossible',
      description: getApiErrorMessage(error),
      color: 'error',
    })
  }
  finally {
    pullLoading.value = false
  }
}
</script>

<template>
  <AppDashboardPanel>
    <template #header>
      <AppDashboardNavbar title="Clés API & transfert">
        <template #right>
          <UButton
            label="Nouvelle clé"
            icon="i-lucide-key-round"
            @click="createOpen = true"
          />
        </template>
      </AppDashboardNavbar>
    </template>

    <div class="p-4 space-y-8">
      <section class="space-y-4">
        <div>
          <h2 class="font-medium text-highlighted">
            Clés de cette instance
          </h2>
          <p class="text-sm text-muted mt-1">
            Créez une clé ici pour permettre à un autre environnement (CLI ou admin distant)
            de <strong>tirer</strong> le contenu de <em>cette</em> instance.
            Le secret n’est affiché qu’une seule fois.
          </p>
        </div>

        <UTable
          :data="rows"
          :columns="columns"
          :loading="status === 'pending'"
          :ui="DASHBOARD_TABLE_UI"
        >
          <template #actions-cell="{ row }">
            <UButton
              v-if="!row.original.revokedAt"
              color="error"
              variant="ghost"
              size="sm"
              label="Révoquer"
              @click="revokeKey(row.original)"
            />
            <span
              v-else
              class="text-muted text-sm"
            >—</span>
          </template>
        </UTable>
      </section>

      <section class="space-y-4 max-w-2xl">
        <div>
          <h2 class="font-medium text-highlighted">
            Pull depuis un CMS distant
          </h2>
          <p class="text-sm text-muted mt-1">
            Importe articles / recettes / médias (brouillons inclus) <strong>dans cette instance</strong>.
            Indiquez l’URL admin du CMS source et une clé créée sur ce CMS — pas besoin de variables d’environnement.
            Équivalent CLI :
            <code>pnpm cms:clone:prod -- --origin=… --key=…</code>
          </p>
          <UAlert
            color="warning"
            variant="subtle"
            title="Médias sur Workers"
            description="Sur une instance Cloudflare déployée, l’import du scope « media » est bloqué (limites CPU / sous-requêtes). Utilisez le CLI en local, ou importez articles/recettes seuls depuis l’admin."
            class="mt-3"
          />
        </div>

        <UFormField label="Origine du CMS distant">
          <UInput
            v-model="pullForm.origin"
            placeholder="https://admin.journalducuistot.fr"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Clé API du CMS distant">
          <UInput
            v-model="pullForm.apiKey"
            type="password"
            placeholder="jdc_…"
            class="w-full"
            autocomplete="off"
          />
        </UFormField>

        <UCheckboxGroup
          v-model="pullForm.scopes"
          legend="Contenu à importer"
          variant="card"
          :items="scopeItems"
        />

        <UCheckbox
          v-model="pullForm.dryRun"
          variant="list"
          label="Simulation (dry-run)"
          description="Compte les ressources sans écrire en base ni télécharger les fichiers."
        />

        <UFormField
          v-if="!pullForm.dryRun"
          :label="`Confirmation — taper ${TRANSFER_PULL_CONFIRM_PHRASE}`"
        >
          <UInput
            v-model="pullForm.confirm"
            :placeholder="TRANSFER_PULL_CONFIRM_PHRASE"
            class="w-full"
          />
        </UFormField>

        <div class="flex flex-wrap gap-3">
          <UButton
            icon="i-lucide-download-cloud"
            :label="pullForm.dryRun ? 'Lancer la simulation' : 'Importer dans cette instance'"
            :loading="pullLoading"
            @click="runPull"
          />
        </div>

        <UAlert
          v-if="pullResult"
          :color="pullResult.dryRun ? 'info' : 'success'"
          variant="subtle"
          :title="pullResult.dryRun ? 'Résultat simulation' : 'Résultat import'"
          :description="`Source ${pullResult.origin} — ${
            Object.entries(pullResult.counts).map(([k, v]) => `${k}: ${v}`).join(', ') || 'vide'
          }`"
        />
      </section>
    </div>

    <UModal v-model:open="createOpen" title="Créer une clé API">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Nom">
            <UInput v-model="createForm.name" placeholder="clone-local" class="w-full" />
          </UFormField>
          <UCheckboxGroup
            v-model="createForm.scopes"
            legend="Droits"
            variant="card"
            :items="scopeItems"
          />
          <UFormField
            label="Expiration (optionnel)"
            hint="Laissez vide pour illimité"
          >
            <UInput
              v-model="createForm.expiresAt"
              type="datetime-local"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="Annuler"
            color="neutral"
            variant="ghost"
            @click="createOpen = false"
          />
          <UButton
            label="Créer"
            :loading="createLoading"
            @click="createKey"
          />
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="secretOpen"
      title="Secret de la clé"
      description="Copiez-le maintenant — il ne sera plus jamais affiché."
    >
      <template #body>
        <UTextarea
          :model-value="createdSecret"
          readonly
          autoresize
          class="font-mono text-sm"
        />
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="Copier"
            icon="i-lucide-copy"
            @click="copySecret"
          />
          <UButton
            label="Fermer"
            color="neutral"
            @click="secretOpen = false; createdSecret = ''"
          />
        </div>
      </template>
    </UModal>
  </AppDashboardPanel>
</template>
