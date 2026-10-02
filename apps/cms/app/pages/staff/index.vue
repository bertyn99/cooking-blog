<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { passwordSchema } from '#shared/validators/auth'
import { getApiErrorMessage } from '#shared/api-error'
import type { StaffUserPublic } from '~/types/staff'
import { DASHBOARD_TABLE_UI } from '~/utils/dashboard-shell'

definePageMeta({
  middleware: ['admin'],
})

const { $api } = useNuxtApp()
const toast = useToast()
const { user: sessionUser } = useUserSession()

type StaffListResponse = {
  data: StaffUserPublic[]
  meta: { pagination: { page: number, pageSize: number, total: number, pageCount: number } }
}

const pagination = ref({ pageIndex: 0, pageSize: 10 })

const { data, status, refresh } = await useAsyncData(
  'staff-users',
  () => $api<StaffListResponse>('/api/admin/users', {
    query: {
      page: pagination.value.pageIndex + 1,
      pageSize: pagination.value.pageSize,
    },
  }),
  { watch: [pagination] },
)

const rows = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta.pagination.total ?? 0)

const createOpen = ref(false)
const createLoading = ref(false)
const confirmOpen = ref(false)
const pendingAction = ref<{
  label: string
  description: string
  run: () => Promise<void>
} | null>(null)

const createForm = reactive({
  email: '',
  username: '',
  password: '',
  role: 'editor' as 'admin' | 'editor',
})

const passwordMinLength = 8
const createPasswordError = computed(() => {
  if (!createForm.password) return undefined
  const parsed = passwordSchema.safeParse(createForm.password)
  return parsed.success ? undefined : 'Au moins 8 caractères.'
})

const roleItems = [
  { label: 'Éditeur', value: 'editor' },
  { label: 'Administrateur', value: 'admin' },
]

const roleColor = {
  admin: 'primary',
  editor: 'neutral',
  agent: 'info',
} as const

function roleLabel(role: StaffUserPublic['role']) {
  if (role === 'admin') return 'Administrateur'
  if (role === 'agent') return 'Agent (système)'
  return 'Éditeur'
}

function isSystemAgent(row: StaffUserPublic) {
  return row.role === 'agent'
}

const columns: TableColumn<StaffUserPublic>[] = [
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'username', header: 'Nom' },
  {
    accessorKey: 'role',
    header: 'Rôle',
    cell: ({ row }) => roleLabel(row.original.role),
  },
  {
    accessorKey: 'isActive',
    header: 'Statut',
    cell: ({ row }) => row.original.isActive ? 'Actif' : 'Désactivé',
  },
  {
    accessorKey: 'createdAt',
    header: 'Créé le',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('fr-FR'),
  },
  { id: 'actions', header: 'Actions' },
]

async function createUser() {
  if (createPasswordError.value) {
    toast.add({ title: 'Mot de passe invalide', description: createPasswordError.value, color: 'warning' })
    return
  }
  createLoading.value = true
  try {
    await $api('/api/admin/users', {
      method: 'POST',
      body: {
        email: createForm.email.trim(),
        username: createForm.username.trim() || undefined,
        password: createForm.password,
        role: createForm.role,
      },
    })
    toast.add({ title: 'Utilisateur créé', color: 'success' })
    createOpen.value = false
    createForm.email = ''
    createForm.username = ''
    createForm.password = ''
    createForm.role = 'editor'
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

async function patchUser(id: number, body: Record<string, unknown>) {
  try {
    await $api(`/api/admin/users/${id}`, { method: 'PATCH', body })
    toast.add({ title: 'Utilisateur mis à jour', color: 'success' })
    await refresh()
  }
  catch (error) {
    toast.add({
      title: 'Mise à jour impossible',
      description: getApiErrorMessage(error),
      color: 'error',
    })
  }
}

function requestConfirm(label: string, description: string, run: () => Promise<void>) {
  pendingAction.value = { label, description, run }
  confirmOpen.value = true
}

async function executePendingAction() {
  const action = pendingAction.value
  if (!action) return
  confirmOpen.value = false
  pendingAction.value = null
  await action.run()
}

function toggleActive(row: StaffUserPublic) {
  const nextActive = !row.isActive
  requestConfirm(
    nextActive ? 'Réactiver le compte' : 'Désactiver le compte',
    `${row.email} — la session en cours sera invalidée au prochain appel API.`,
    () => patchUser(row.id, { isActive: nextActive }),
  )
}

function cycleRole(row: StaffUserPublic) {
  const next = row.role === 'admin' ? 'editor' : 'admin'
  requestConfirm(
    'Changer le rôle',
    `${row.email} → ${next === 'admin' ? 'administrateur' : 'éditeur'}. La session en cours sera invalidée.`,
    () => patchUser(row.id, { role: next }),
  )
}

function isSelf(row: StaffUserPublic) {
  return row.id === sessionUser.value?.id
}
</script>

<template>
  <AppDashboardPanel id="staff">
    <template #header>
      <AppDashboardNavbar title="Équipe">
        <template #right>
          <UButton
            icon="i-lucide-user-plus"
            label="Nouvel utilisateur"
            size="sm"
            @click="createOpen = true"
          />
        </template>
      </AppDashboardNavbar>
    </template>

    <div class="space-y-4 p-4 sm:p-6">
      <p class="text-sm text-muted">
        Gérez les comptes administrateurs et éditeurs. Seuls les administrateurs peuvent publier, importer depuis Strapi et accéder à la maintenance.
      </p>

      <UTable
        :data="rows"
        :columns="columns"
        :loading="status === 'pending'"
        :ui="DASHBOARD_TABLE_UI"
      >
        <template #role-cell="{ row }">
          <UBadge :color="roleColor[row.original.role]" variant="subtle">
            {{ roleLabel(row.original.role) }}
          </UBadge>
        </template>

        <template #isActive-cell="{ row }">
          <UBadge :color="row.original.isActive ? 'success' : 'warning'" variant="subtle">
            {{ row.original.isActive ? 'Actif' : 'Désactivé' }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div v-if="isSystemAgent(row.original)" class="text-muted text-sm text-right">
            Compte système
          </div>
          <div v-else class="flex flex-wrap justify-end gap-1">
            <UButton
              size="xs"
              variant="ghost"
              :label="row.original.role === 'admin' ? 'Passer éditeur' : 'Passer admin'"
              :disabled="isSelf(row.original)"
              @click="cycleRole(row.original)"
            />
            <UButton
              size="xs"
              variant="ghost"
              :color="row.original.isActive ? 'warning' : 'success'"
              :label="row.original.isActive ? 'Désactiver' : 'Réactiver'"
              :disabled="isSelf(row.original)"
              @click="toggleActive(row.original)"
            />
          </div>
        </template>
      </UTable>

      <div class="text-sm text-muted">
        {{ total }} compte(s)
      </div>
    </div>

    <UModal v-model:open="createOpen" title="Nouvel utilisateur">
      <template #body>
        <form class="space-y-4" @submit.prevent="createUser">
          <UFormField label="Email" required>
            <UInput v-model="createForm.email" type="email" autocomplete="off" class="w-full" />
          </UFormField>
          <UFormField label="Nom affiché">
            <UInput v-model="createForm.username" autocomplete="off" class="w-full" />
          </UFormField>
          <UFormField label="Mot de passe" required :error="createPasswordError">
            <UInput
              v-model="createForm.password"
              type="password"
              autocomplete="new-password"
              class="w-full"
              :minlength="passwordMinLength"
            />
          </UFormField>
          <UFormField label="Rôle" required>
            <USelect v-model="createForm.role" :items="roleItems" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" label="Annuler" @click="createOpen = false" />
            <UButton type="submit" label="Créer" :loading="createLoading" />
          </div>
        </form>
      </template>
    </UModal>

    <UModal v-model:open="confirmOpen" :title="pendingAction?.label ?? 'Confirmer'">
      <template #body>
        <p class="text-sm text-muted">
          {{ pendingAction?.description }}
        </p>
        <div class="mt-4 flex justify-end gap-2">
          <UButton variant="ghost" label="Annuler" @click="confirmOpen = false" />
          <UButton color="primary" label="Confirmer" @click="executePendingAction" />
        </div>
      </template>
    </UModal>
  </AppDashboardPanel>
</template>
