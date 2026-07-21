<script setup lang="ts">
const description = defineModel<string>('description', { default: '' })
const keywords = defineModel<string>('keywords', { default: '' })
const metaRobots = defineModel<string>('metaRobots', { default: 'index, follow' })

const props = defineProps<{
  hasEntry: boolean
}>()

const showForm = ref(props.hasEntry)

watch(() => props.hasEntry, (value) => {
  if (value) {
    showForm.value = true
  }
})
</script>

<template>
  <div class="rounded-lg border border-default bg-elevated/20 p-3">
    <ContentFieldLabel label="seo" :count="hasEntry ? 1 : 0" />

    <button
      v-if="!showForm"
      type="button"
      class="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-default bg-default/40 px-4 py-10 text-sm text-muted transition hover:border-primary/40 hover:bg-elevated/50"
      @click="showForm = true"
    >
      <UIcon name="i-lucide-plus" class="size-5 text-primary" />
      <span>No entry yet. Click to add one.</span>
    </button>

    <div v-else class="space-y-3">
      <UFormField label="Meta description" name="seoDescription">
        <UTextarea v-model="description" :rows="3" placeholder="Description pour les moteurs de recherche" />
      </UFormField>

      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField label="Mots-clés" name="seoKeywords">
          <UInput v-model="keywords" placeholder="cuisine, recette, été" />
        </UFormField>

        <UFormField label="Meta robots" name="seoRobots">
          <UInput v-model="metaRobots" placeholder="index, follow" />
        </UFormField>
      </div>
    </div>
  </div>
</template>
