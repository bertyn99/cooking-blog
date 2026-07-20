<template>
  <UDashboardPanel id="recipe-new">
    <template #header>
      <UDashboardNavbar title="Nouvelle recette">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <ContentRecipeForm />
    </template>
  </UDashboardPanel>
</template>
