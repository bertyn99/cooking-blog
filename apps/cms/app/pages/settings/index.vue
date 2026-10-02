<script setup lang="ts">
import {
  EDITOR_PAGE_DEFAULT_VIEW_KEY,
  parsePageEditorDefaultView,
  type PageEditorDefaultView,
} from '#shared/site-settings-keys'

const { $api } = useNuxtApp()
const toast = useToast()
const saving = ref(false)

const defaultView = ref<PageEditorDefaultView>('editor')

const { data, status } = await useAsyncData('site-settings', () =>
  $api<{ data: Array<{ key: string, value: unknown }> }>('/api/site-settings'),
)

watch(
  data,
  (response) => {
    const row = response?.data?.find(item => item.key === EDITOR_PAGE_DEFAULT_VIEW_KEY)
    defaultView.value = parsePageEditorDefaultView(row?.value)
  },
  { immediate: true },
)

async function saveDefaultView() {
  saving.value = true
  try {
    await $api(`/api/site-settings/${EDITOR_PAGE_DEFAULT_VIEW_KEY}`, {
      method: 'PUT',
      body: { value: defaultView.value },
    })
    toast.add({ title: 'Paramètres enregistrés', color: 'success' })
  }
  catch {
    toast.add({ title: 'Erreur lors de l’enregistrement', color: 'error' })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <AppDashboardPanel title="Paramètres">
    <template #body>
      <div v-if="status === 'pending'" class="p-6">
        <USkeleton class="h-8 w-64" />
      </div>

          <div v-else-if="status === 'error'" class="mx-auto max-w-xl p-6">
            <UAlert
              color="error"
              title="Impossible de charger les paramètres"
              description="Réessayez plus tard. Enregistrer maintenant écraserait la valeur par défaut."
            />
          </div>

          <div v-else class="mx-auto max-w-xl space-y-6 p-6">
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">
              Éditeur de pages
            </h2>
          </template>

          <p class="mb-4 text-sm text-muted">
            Vue par défaut à l’ouverture d’une page CMS (canvas ou éditeur markdown).
          </p>

          <URadioGroup
            v-model="defaultView"
            :items="[
              { label: 'Éditeur markdown', value: 'editor' },
              { label: 'Vue simple (canvas)', value: 'simple' },
            ]"
          />

          <div class="mt-6 flex justify-end">
            <UButton
              label="Enregistrer"
              icon="i-lucide-save"
              :loading="saving"
              :disabled="status === 'error'"
              @click="saveDefaultView"
            />
          </div>
        </UCard>
      </div>
    </template>
  </AppDashboardPanel>
</template>
