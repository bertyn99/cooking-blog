<script setup lang="ts">
import {
  AMAZON_AFFILIATE_TAG_KEY,
  EDITOR_PAGE_DEFAULT_VIEW_KEY,
  parseAmazonAffiliateTag,
  parsePageEditorDefaultView,
  type PageEditorDefaultView,
} from '#shared/site-settings-keys'
import { amazonAffiliatePreviewUrl } from '#shared/glossary-affiliate'

const { $api } = useNuxtApp()
const toast = useToast()
const saving = ref(false)
const savingTag = ref(false)

const defaultView = ref<PageEditorDefaultView>('editor')
const amazonTag = ref('')

const { data, status } = await useAsyncData('site-settings', () =>
  $api<{ data: Array<{ key: string, value: unknown }> }>('/api/site-settings'),
)

watch(
  data,
  (response) => {
    const viewRow = response?.data?.find(item => item.key === EDITOR_PAGE_DEFAULT_VIEW_KEY)
    defaultView.value = parsePageEditorDefaultView(viewRow?.value)
    const tagRow = response?.data?.find(item => item.key === AMAZON_AFFILIATE_TAG_KEY)
    amazonTag.value = parseAmazonAffiliateTag(tagRow?.value)
  },
  { immediate: true },
)

const amazonPreview = computed(() => amazonAffiliatePreviewUrl(amazonTag.value.trim() || null))

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

async function saveAmazonTag() {
  savingTag.value = true
  try {
    await $api(`/api/site-settings/${AMAZON_AFFILIATE_TAG_KEY}`, {
      method: 'PUT',
      body: { value: amazonTag.value.trim() },
    })
    toast.add({ title: 'Tag Amazon enregistré', color: 'success' })
  }
  catch {
    toast.add({ title: 'Erreur lors de l’enregistrement', color: 'error' })
  }
  finally {
    savingTag.value = false
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

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">
              Affiliation Amazon
            </h2>
          </template>

          <p class="mb-4 text-sm text-muted">
            Tag partenaire unique pour tous les ustensiles du glossaire. Le site public
            reçoit toujours l’URL déjà résolue.
          </p>

          <UFormField label="Tag Amazon">
            <UInput
              v-model="amazonTag"
              placeholder="journalducuistot-21"
            />
          </UFormField>

          <p class="mt-3 text-sm text-muted">
            Exemple :
            <a
              :href="amazonPreview"
              class="break-all text-highlighted underline"
              target="_blank"
              rel="nofollow sponsored noopener"
            >{{ amazonPreview }}</a>
          </p>

          <div class="mt-6 flex justify-end">
            <UButton
              label="Enregistrer le tag"
              icon="i-lucide-save"
              :loading="savingTag"
              :disabled="status === 'error'"
              @click="saveAmazonTag"
            />
          </div>
        </UCard>
      </div>
    </template>
  </AppDashboardPanel>
</template>
