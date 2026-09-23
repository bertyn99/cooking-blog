<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import {
  AGENT_SCOPES,
  AGENT_SCOPE_LABELS,
  API_KEY_SCOPE_LABELS,
  TRANSFER_SCOPES,
  type ApiKeyScope,
} from '#shared/api-keys'
import { TRANSFER_PULL_CONFIRM_PHRASE, TRANSFER_SCOPES as PULL_SCOPES } from '#shared/transfer-pull'
import { getApiErrorMessage } from '#shared/api-error'
import { DASHBOARD_SURFACE_CLASS, DASHBOARD_TABLE_UI } from '~/utils/dashboard-shell'

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

const scopeShortLabel: Record<ApiKeyScope, string> = {
  articles: 'Articles',
  recipes: 'Recettes',
  pages: 'Pages',
  media: 'Médias',
  write: 'Écriture',
}

const scopeBadgeColor: Record<ApiKeyScope, 'primary' | 'info' | 'warning' | 'neutral'> = {
  write: 'primary',
  articles: 'info',
  recipes: 'info',
  pages: 'info',
  media: 'warning',
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
const showRevoked = ref(true)

const visibleRows = computed(() => (
  showRevoked.value
    ? rows.value
    : rows.value.filter(row => !row.revokedAt)
))

const keyStats = computed(() => ({
  active: rows.value.filter(row => !row.revokedAt).length,
  revoked: rows.value.filter(row => row.revokedAt).length,
}))

const createOpen = ref(false)
const createLoading = ref(false)
const secretOpen = ref(false)
const secretModalTitle = ref('Secret de la clé')
const secretModalDescription = ref('Copiez-le maintenant — il ne sera plus jamais affiché.')
const createdSecret = ref('')
const regenerateLoadingId = ref<number | null>(null)
const purgeLoadingId = ref<number | null>(null)
const editScopesOpen = ref(false)
const editScopesLoading = ref(false)
const editingKey = ref<ApiKeyPublic | null>(null)
const editScopesForm = reactive({
  scopes: [] as ApiKeyScope[],
})
const pullLoading = ref(false)
const pullResult = ref<PullResult | null>(null)
const confirmOpen = ref(false)
const pendingAction = ref<{
  label: string
  description: string
  color?: 'primary' | 'error'
  run: () => Promise<void>
} | null>(null)

const createForm = reactive({
  name: '',
  scopes: [] as ApiKeyScope[],
  expiresAt: '',
})

const pullForm = reactive({
  origin: '',
  apiKey: '',
  scopes: [...PULL_SCOPES] as ApiKeyScope[],
  dryRun: true,
  confirm: '',
})

const transferScopeItems = TRANSFER_SCOPES.map(scope => ({
  label: API_KEY_SCOPE_LABELS[scope],
  value: scope,
}))

const agentScopeItems = AGENT_SCOPES.map(scope => ({
  label: AGENT_SCOPE_LABELS[scope],
  value: scope,
}))

const columns: TableColumn<ApiKeyPublic>[] = [
  { accessorKey: 'name', header: 'Nom' },
  { accessorKey: 'keyPrefix', header: 'Préfixe' },
  { accessorKey: 'scopes', header: 'Droits' },
  { accessorKey: 'lastUsedAt', header: 'Dernier usage' },
  { accessorKey: 'revokedAt', header: 'Statut' },
  { id: 'actions', header: '' },
]

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function isExpired(row: ApiKeyPublic) {
  if (!row.expiresAt) return false
  return new Date(row.expiresAt).getTime() <= Date.now()
}

function keyStatus(row: ApiKeyPublic) {
  if (row.revokedAt) return { label: 'Révoquée', color: 'error' as const }
  if (isExpired(row)) return { label: 'Expirée', color: 'warning' as const }
  return { label: 'Active', color: 'success' as const }
}

function applyMcpPreset() {
  createForm.scopes = ['articles', 'recipes', 'pages', 'media', 'write']
}

function applyTransferPreset() {
  createForm.scopes = ['articles', 'recipes', 'media']
}

function applyMcpPresetToEdit() {
  editScopesForm.scopes = ['articles', 'recipes', 'pages', 'media', 'write']
}

function applyTransferPresetToEdit() {
  editScopesForm.scopes = ['articles', 'recipes', 'media']
}

function openEditScopes(row: ApiKeyPublic) {
  editingKey.value = row
  editScopesForm.scopes = [...row.scopes]
  editScopesOpen.value = true
}

function openConfirm(action: typeof pendingAction.value) {
  pendingAction.value = action
  confirmOpen.value = true
}

async function executePendingAction() {
  const action = pendingAction.value
  if (!action) return
  confirmOpen.value = false
  pendingAction.value = null
  await action.run()
}

function confirmRegenerate(row: ApiKeyPublic) {
  openConfirm({
    label: 'Régénérer le secret',
    description: `Un nouveau secret sera généré pour « ${row.name} ». L’ancien cessera immédiatement de fonctionner (MCP, CLI, .env). Les droits restent identiques.`,
    run: () => regenerateKey(row),
  })
}

function confirmRevoke(row: ApiKeyPublic) {
  openConfirm({
    label: 'Révoquer la clé',
    description: `La clé « ${row.name} » (${row.keyPrefix}…) sera désactivée. Vous pourrez la supprimer définitivement ensuite.`,
    color: 'error',
    run: () => revokeKey(row),
  })
}

function confirmPurge(row: ApiKeyPublic) {
  openConfirm({
    label: 'Supprimer la clé',
    description: `Supprimer définitivement « ${row.name} » ? Cette action est irréversible. Les entrées du journal MCP conservent l’historique sans lien vers la clé.`,
    color: 'error',
    run: () => purgeKey(row),
  })
}

function keyActionItems(row: ApiKeyPublic): DropdownMenuItem[][] {
  if (row.revokedAt) {
    return [[{
      label: 'Supprimer définitivement',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => confirmPurge(row),
    }]]
  }

  return [[
    {
      label: 'Modifier les droits',
      icon: 'i-lucide-shield',
      onSelect: () => openEditScopes(row),
    },
    {
      label: 'Régénérer le secret',
      icon: 'i-lucide-refresh-cw',
      onSelect: () => confirmRegenerate(row),
    },
    {
      label: 'Révoquer',
      icon: 'i-lucide-ban',
      color: 'error',
      onSelect: () => confirmRevoke(row),
    },
  ]]
}

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
    secretModalTitle.value = 'Secret de la clé'
    secretModalDescription.value = 'Copiez-le maintenant — il ne sera plus jamais affiché.'
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

async function saveScopes() {
  if (!editingKey.value) return
  if (editScopesForm.scopes.length === 0) {
    toast.add({
      title: 'Formulaire incomplet',
      description: 'Sélectionnez au moins un droit.',
      color: 'warning',
    })
    return
  }

  editScopesLoading.value = true
  try {
    await $api(`/api/admin/api-keys/${editingKey.value.id}`, {
      method: 'PATCH',
      body: { scopes: editScopesForm.scopes },
    })
    toast.add({ title: 'Droits mis à jour', color: 'success' })
    editScopesOpen.value = false
    editingKey.value = null
    editScopesForm.scopes = []
    await refresh()
  }
  catch (error) {
    toast.add({
      title: 'Mise à jour impossible',
      description: getApiErrorMessage(error),
      color: 'error',
    })
  }
  finally {
    editScopesLoading.value = false
  }
}

async function regenerateKey(row: ApiKeyPublic) {
  if (row.revokedAt) return
  regenerateLoadingId.value = row.id
  try {
    const result = await $api<{ data: ApiKeyPublic, secret: string }>(
      `/api/admin/api-keys/${row.id}/regenerate`,
      { method: 'POST' },
    )
    createdSecret.value = result.secret
    secretModalTitle.value = 'Nouveau secret'
    secretModalDescription.value = `L’ancien secret de « ${row.name} » ne fonctionne plus. Mettez à jour CMS_API_KEY ou votre client MCP.`
    secretOpen.value = true
    await refresh()
  }
  catch (error) {
    toast.add({
      title: 'Régénération impossible',
      description: getApiErrorMessage(error),
      color: 'error',
    })
  }
  finally {
    regenerateLoadingId.value = null
  }
}

async function purgeKey(row: ApiKeyPublic) {
  if (!row.revokedAt) return
  purgeLoadingId.value = row.id
  try {
    await $api(`/api/admin/api-keys/${row.id}/purge`, { method: 'DELETE' })
    toast.add({ title: 'Clé supprimée', color: 'success' })
    await refresh()
  }
  catch (error) {
    toast.add({
      title: 'Suppression impossible',
      description: getApiErrorMessage(error),
      color: 'error',
    })
  }
  finally {
    purgeLoadingId.value = null
  }
}

const { copy: copyToClipboard, isSupported: clipboardSupported } = useClipboard()

async function copySecret() {
  if (!clipboardSupported.value) {
    toast.add({
      title: 'Copie impossible',
      description: 'Sélectionnez le secret et copiez-le manuellement.',
      color: 'warning',
    })
    return
  }
  try {
    await copyToClipboard(createdSecret.value)
    toast.add({ title: 'Secret copié', color: 'success' })
  }
  catch {
    toast.add({
      title: 'Copie impossible',
      description: 'Sélectionnez le secret et copiez-le manuellement.',
      color: 'warning',
    })
  }
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
            size="sm"
            @click="createOpen = true"
          />
        </template>
      </AppDashboardNavbar>
    </template>

    <div class="space-y-6 p-4 sm:p-6">
      <p class="max-w-3xl text-sm text-muted">
        Gérez les clés pour l’agent MCP (Cursor), l’API REST brouillons et le transfert de contenu entre instances.
        Le secret complet n’est affiché qu’à la création ou après régénération.
      </p>

      <div :class="[DASHBOARD_SURFACE_CLASS, 'flex flex-wrap items-center gap-4 p-4 sm:p-5']">
        <div class="min-w-28">
          <p class="text-2xl font-semibold tabular-nums text-highlighted">
            {{ keyStats.active }}
          </p>
          <p class="text-sm text-muted">
            clé{{ keyStats.active > 1 ? 's' : '' }} active{{ keyStats.active > 1 ? 's' : '' }}
          </p>
        </div>
        <div class="h-10 w-px bg-default/70" aria-hidden="true" />
        <div class="min-w-28">
          <p class="text-2xl font-semibold tabular-nums text-muted">
            {{ keyStats.revoked }}
          </p>
          <p class="text-sm text-muted">
            révoquée{{ keyStats.revoked > 1 ? 's' : '' }}
          </p>
        </div>
      </div>

      <ApiKeysAgentConnectionGuide @create-key="createOpen = true" />

      <section :class="[DASHBOARD_SURFACE_CLASS, 'space-y-4 p-4 sm:p-5']">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="font-medium text-highlighted">
              Clés de cette instance
            </h2>
            <p class="mt-1 text-sm text-muted">
              Exportez le contenu vers un autre environnement, ou autorisez un agent à éditer des brouillons.
            </p>
          </div>
          <UCheckbox
            v-model="showRevoked"
            variant="list"
            label="Afficher les clés révoquées"
          />
        </div>

        <div
          v-if="!status.pending && visibleRows.length === 0"
          class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-default/70 px-6 py-12 text-center"
        >
          <div class="flex size-12 items-center justify-center rounded-full bg-elevated text-muted">
            <UIcon name="i-lucide-key-round" class="size-6" />
          </div>
          <div class="space-y-1">
            <p class="font-medium text-highlighted">
              Aucune clé pour le moment
            </p>
            <p class="text-sm text-muted">
              Créez une clé pour connecter Cursor ou cloner le contenu depuis la production.
            </p>
          </div>
          <UButton
            label="Créer une clé"
            icon="i-lucide-plus"
            size="sm"
            @click="createOpen = true"
          />
        </div>

        <UTable
          v-else
          :data="visibleRows"
          :columns="columns"
          :loading="status === 'pending'"
          :ui="DASHBOARD_TABLE_UI"
        >
          <template #name-cell="{ row }">
            <div class="min-w-0">
              <p
                class="truncate font-medium"
                :class="row.original.revokedAt ? 'text-muted line-through' : 'text-highlighted'"
              >
                {{ row.original.name }}
              </p>
              <p
                v-if="row.original.expiresAt"
                class="text-xs text-muted"
              >
                Expire le {{ formatDateTime(row.original.expiresAt) }}
              </p>
            </div>
          </template>

          <template #keyPrefix-cell="{ row }">
            <code class="rounded bg-elevated px-1.5 py-0.5 font-mono text-xs text-muted">
              {{ row.original.keyPrefix }}…
            </code>
          </template>

          <template #scopes-cell="{ row }">
            <div class="flex max-w-md flex-wrap gap-1">
              <UBadge
                v-for="scope in row.original.scopes"
                :key="`${row.original.id}-${scope}`"
                :color="scopeBadgeColor[scope]"
                variant="subtle"
                size="sm"
              >
                {{ scopeShortLabel[scope] }}
              </UBadge>
            </div>
          </template>

          <template #lastUsedAt-cell="{ row }">
            <span class="text-sm text-muted tabular-nums">
              {{ formatDateTime(row.original.lastUsedAt) }}
            </span>
          </template>

          <template #revokedAt-cell="{ row }">
            <UBadge
              :color="keyStatus(row.original).color"
              variant="subtle"
              size="sm"
            >
              {{ keyStatus(row.original).label }}
            </UBadge>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex justify-end">
              <UDropdownMenu
                :items="keyActionItems(row.original)"
                :content="{ align: 'end' }"
              >
                <UButton
                  icon="i-lucide-ellipsis-vertical"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :loading="regenerateLoadingId === row.original.id || purgeLoadingId === row.original.id"
                  aria-label="Actions sur la clé"
                />
              </UDropdownMenu>
            </div>
          </template>
        </UTable>
      </section>

      <section :class="[DASHBOARD_SURFACE_CLASS, 'space-y-5 p-4 sm:p-5']">
        <div>
          <h2 class="font-medium text-highlighted">
            Pull depuis un CMS distant
          </h2>
          <p class="mt-1 text-sm text-muted">
            Importe articles, recettes et médias (brouillons inclus) dans cette instance.
            Équivalent CLI :
            <code class="rounded bg-elevated px-1 py-0.5 text-xs">pnpm cms:clone:prod -- --origin=… --key=…</code>
          </p>
        </div>

        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="Médias sur Workers"
          description="Sur Cloudflare, l’import du scope « media » est bloqué (limites CPU). Utilisez le CLI en local, ou importez articles/recettes seuls."
        />

        <div class="grid gap-4 md:grid-cols-2">
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
        </div>

        <UCheckboxGroup
          v-model="pullForm.scopes"
          legend="Contenu à importer"
          variant="card"
          :items="transferScopeItems"
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

    <UModal
      v-model:open="editScopesOpen"
      :title="editingKey ? `Droits — ${editingKey.name}` : 'Modifier les droits'"
      description="Le secret reste inchangé. Les agents connectés verront les nouveaux droits au prochain appel."
    >
      <template #body>
        <div class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <UButton
              size="xs"
              variant="soft"
              color="primary"
              label="Préréglage MCP"
              icon="i-lucide-bot"
              @click="applyMcpPresetToEdit"
            />
            <UButton
              size="xs"
              variant="soft"
              color="neutral"
              label="Préréglage transfert"
              icon="i-lucide-download-cloud"
              @click="applyTransferPresetToEdit"
            />
          </div>

          <UCheckboxGroup
            v-model="editScopesForm.scopes"
            legend="Transfert (lecture distante)"
            variant="card"
            :items="transferScopeItems"
          />
          <UCheckboxGroup
            v-model="editScopesForm.scopes"
            legend="Agent (brouillons + MCP)"
            variant="card"
            :items="agentScopeItems"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="Annuler"
            color="neutral"
            variant="ghost"
            @click="editScopesOpen = false"
          />
          <UButton
            label="Enregistrer"
            :loading="editScopesLoading"
            @click="saveScopes"
          />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="createOpen" title="Créer une clé API">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Nom">
            <UInput v-model="createForm.name" placeholder="agent-cursor" class="w-full" />
          </UFormField>

          <div class="flex flex-wrap gap-2">
            <UButton
              size="xs"
              variant="soft"
              color="primary"
              label="Préréglage MCP"
              icon="i-lucide-bot"
              @click="applyMcpPreset"
            />
            <UButton
              size="xs"
              variant="soft"
              color="neutral"
              label="Préréglage transfert"
              icon="i-lucide-download-cloud"
              @click="applyTransferPreset"
            />
          </div>

          <UCheckboxGroup
            v-model="createForm.scopes"
            legend="Transfert (lecture distante)"
            variant="card"
            :items="transferScopeItems"
          />
          <UCheckboxGroup
            v-model="createForm.scopes"
            legend="Agent (brouillons + MCP)"
            variant="card"
            :items="agentScopeItems"
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
      :title="secretModalTitle"
      :description="secretModalDescription"
    >
      <template #body>
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-shield-alert"
          title="Secret sensible"
          description="Ne partagez pas ce secret. Stockez-le dans CMS_API_KEY ou votre gestionnaire de mots de passe."
          class="mb-4"
        />
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

    <UModal v-model:open="confirmOpen" :title="pendingAction?.label ?? 'Confirmer'">
      <template #body>
        <p class="text-sm text-muted">
          {{ pendingAction?.description }}
        </p>
        <div class="mt-4 flex justify-end gap-2">
          <UButton variant="ghost" label="Annuler" @click="confirmOpen = false" />
          <UButton
            :color="pendingAction?.color ?? 'primary'"
            label="Confirmer"
            @click="executePendingAction"
          />
        </div>
      </template>
    </UModal>
  </AppDashboardPanel>
</template>
