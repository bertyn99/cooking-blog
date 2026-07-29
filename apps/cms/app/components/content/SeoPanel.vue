<script setup lang="ts">
const description = defineModel<string>('description', { default: '' })
const keywords = defineModel<string>('keywords', { default: '' })
const metaRobots = defineModel<string>('metaRobots', { default: 'index, follow' })

const props = defineProps<{
  hasEntry: boolean
  anchor?: string
}>()

const showForm = ref(props.hasEntry)

watch(() => props.hasEntry, (value) => {
  if (value) {
    showForm.value = true
  }
})
</script>

<template>
  <ContentEditorSection
    label="seo"
    :count="hasEntry ? 1 : 0"
    :anchor="anchor"
    description="Titre et extrait pour Google et les réseaux sociaux."
  >
    <button
      v-if="!showForm"
      type="button"
      class="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-default bg-elevated/30 px-4 py-10 text-sm text-muted transition hover:border-primary/40 hover:bg-elevated/60"
      @click="showForm = true"
    >
      <UIcon name="i-lucide-search" class="size-5 text-primary" />
      <span>Ajouter une entrée SEO</span>
    </button>

    <div
      v-else
    >
      <ContentEditorSurface class="space-y-3">
      <UFormField label="Meta description" name="seoDescription">
        <UTextarea v-model="description" :rows="4" autoresize placeholder="Description pour les moteurs de recherche" />
      </UFormField>

      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField label="Mots-clés" name="seoKeywords">
          <UInput v-model="keywords" placeholder="cuisine, recette, été" />
        </UFormField>

        <UFormField label="Meta robots" name="seoRobots">
          <UInput v-model="metaRobots" placeholder="index, follow" />
        </UFormField>
      </div>
      </ContentEditorSurface>
    </div>
  </ContentEditorSection>
</template>
