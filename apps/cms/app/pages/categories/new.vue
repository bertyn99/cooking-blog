<template>
  <AppDashboardPanel id="category-new">
    <template #header>
      <AppDashboardNavbar title="Nouvelle catégorie" />
    </template>

    <template #body>
      <ContentCategoryForm @cancel="navigateTo('/categories')" />
    </template>
  </AppDashboardPanel>
</template>
