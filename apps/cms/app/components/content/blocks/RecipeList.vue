<script setup lang="ts">
import { previewCoverSrc, usePreviewRecipeList } from '~/composables/usePreviewBlockList'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  source?: string
  category?: string
  slugs?: string
  limit?: string | number
}>()

const { data: recipes, status, error } = await usePreviewRecipeList(props)
</script>

<template>
  <div class="py-6">
    <p class="mb-4 text-lg font-semibold text-highlighted">
      Dernières recettes
    </p>
    <p
      v-if="status === 'pending'"
      class="text-sm text-muted"
    >
      Chargement des recettes…
    </p>
    <p
      v-else-if="error"
      class="text-sm text-muted"
    >
      Impossible de charger les recettes.
    </p>
    <p
      v-else-if="!recipes?.length"
      class="text-sm text-muted"
    >
      Aucune recette pour le moment.
    </p>
    <div
      v-else
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div
        v-for="recipe in recipes"
        :key="recipe.id"
        class="overflow-hidden rounded-lg border border-default bg-default"
      >
        <img
          v-if="previewCoverSrc(recipe.coverBlobPathname)"
          :src="previewCoverSrc(recipe.coverBlobPathname)"
          :alt="recipe.title"
          class="aspect-[4/3] w-full object-cover"
        >
        <div
          v-else
          class="flex aspect-[4/3] items-center justify-center bg-elevated text-xs text-muted"
        >
          Recette
        </div>
        <p class="px-3 py-2 text-sm font-medium">
          {{ recipe.title }}
        </p>
      </div>
    </div>
  </div>
</template>
