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
  cover?: { pathname: string, originalName: string | null } | null
  ingredients?: RecipeIngredient[] | null
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
    query: { include: 'cover,category,seo,ingredients,nutrition' },
  }),
  { watch: [id] },
)
</script>

<template>
  <UDashboardPanel id="recipe-edit">
    <template #header>
      <UDashboardNavbar :title="recipe?.title ?? 'Éditer la recette'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="status === 'pending'" class="text-muted">
        Chargement…
      </div>

      <ContentRecipeForm
        v-else-if="recipe"
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
          coverDisplayName: recipe.cover?.originalName ?? recipe.cover?.pathname ?? null,
          ingredients: recipe.ingredients ?? undefined,
          nutrition: recipe.nutrition ?? undefined,
          seo: recipe.seo,
        }"
      />

      <UAlert
        v-else
        color="error"
        title="Recette introuvable"
        description="Cette recette n'existe pas ou a été supprimée."
      />
    </template>
  </UDashboardPanel>
</template>
