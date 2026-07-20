<script setup lang="ts">
const route = useRoute()
const { $api } = useNuxtApp()

const id = computed(() => Number.parseInt(route.params.id as string, 10))

const { data: recipe, status } = await useAsyncData(
  () => `recipe-${id.value}`,
  () => $api<{
    id: number
    title: string
    slug: string
    intro: string | null
    step: string | null
    difficulty: 'easy' | 'medium' | 'hard' | null
    time: number | null
    categoryId: number | null
    status: string
  }>(`/api/recipes/${id.value}`),
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
