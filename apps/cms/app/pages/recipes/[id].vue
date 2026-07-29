<script setup lang="ts">
const route = useRoute()
const { $api } = useNuxtApp()

const id = computed(() => Number.parseInt(route.params.id as string, 10))

interface RecipeIngredient {
  id?: number
  name: string
  qty?: number | null
  unit?: string | null
  sortOrder?: number | null
}

interface RecipeUtensilRow {
  id?: number
  name: string
  note?: string | null
  affiliateUrl?: string | null
  sortOrder?: number | null
}

interface RecipeDetail {
  id: number
  title: string
  slug: string
  intro: string | null
  step: string | null
  difficulty: 'easy' | 'medium' | 'hard' | null
  time: number | null
  categoryId: number | null
  status: string
  coverBlobPathname: string | null
  coverAltText?: string | null
  coverDescription?: string | null
  cover?: { pathname: string, originalName: string | null } | null
  ingredients?: RecipeIngredient[] | null
  utensils?: RecipeUtensilRow[] | null
  nutrition?: {
    lipides: string | null
    proteine: string | null
    sucre: string | null
    calories: string | null
    glucides: string | null
    sodium: string | null
  } | null
  seo?: {
    description: string | null
    keywords: string | null
    metaRobots: string | null
  } | null
}

const { data: recipe, status } = await useAsyncData(
  () => `recipe-${id.value}`,
  () => $api<RecipeDetail>(`/api/recipes/${id.value}`, {
    query: { include: 'cover,category,seo,ingredients,utensils,nutrition' },
  }),
  { watch: [id] },
)
</script>

<template>
  <ContentEditorDetailLayout
    resource-label="Recettes"
    resource-to="/recipes"
    :title="recipe?.title"
    :subtitle="recipe?.slug"
    :loading="status === 'pending'"
  >
    <ContentRecipeForm
      v-if="recipe"
      :recipe-id="recipe.id"
      :initial="{
        title: recipe.title,
        slug: recipe.slug,
        intro: recipe.intro ?? undefined,
        step: recipe.step ?? undefined,
        difficulty: recipe.difficulty ?? undefined,
        time: recipe.time ?? undefined,
        categoryId: recipe.categoryId ?? undefined,
        status: recipe.status,
        coverBlobPathname: recipe.coverBlobPathname,
        coverAltText: recipe.coverAltText ?? null,
        coverDescription: recipe.coverDescription ?? null,
        coverDisplayName: recipe.cover?.originalName ?? recipe.cover?.pathname ?? null,
        ingredients: recipe.ingredients ?? undefined,
        utensils: recipe.utensils ?? undefined,
        nutrition: recipe.nutrition ?? undefined,
        seo: recipe.seo,
      }"
    />

    <UAlert
      v-else-if="status !== 'pending'"
      color="error"
      title="Recette introuvable"
      description="Cette recette n'existe pas ou a été supprimée."
      class="mx-auto max-w-lg"
    />
  </ContentEditorDetailLayout>
</template>
