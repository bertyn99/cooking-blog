<script lang="ts" setup>
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  source?: string
  category?: string
  slugs?: string
  limit?: string | number
}>()

const { data: recipes, status, error } = await useBlockRecipeList(props)
</script>

<template>
  <div>
    <p v-if="status === 'pending'" class="sr-only">
      Chargement des recettes…
    </p>
    <p v-else-if="error" class="text-sm text-neutral-500">
      Impossible de charger les recettes.
    </p>
    <p v-else-if="!recipes?.length" class="text-sm text-neutral-500">
      Aucune recette pour le moment.
    </p>
    <LazyRecipeList
      v-else
      :list="recipes"
      :show-details="true"
    />
  </div>
</template>
