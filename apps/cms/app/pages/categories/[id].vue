<script setup lang="ts">
const route = useRoute()

const id = computed(() => Number(route.params.id))
const categoryType = computed(() => (route.query.type === 'blog' ? 'blog' : 'recette') as 'blog' | 'recette')

if (!Number.isFinite(id.value) || id.value < 1) {
  throw createError({ statusCode: 404, statusMessage: 'Catégorie introuvable' })
}
</script>

<template>
  <AppDashboardPanel :id="`category-${id}`">
    <template #header>
      <AppDashboardNavbar title="Modifier la catégorie" />
    </template>

    <template #body>
      <ContentCategoryForm :category-id="id" :category-type="categoryType" />
    </template>
  </AppDashboardPanel>
</template>
