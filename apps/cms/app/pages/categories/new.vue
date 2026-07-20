<template>
  <UDashboardPanel id="category-new">
    <template #header>
      <UDashboardNavbar title="Nouvelle catégorie">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <ContentCategoryForm />
    </template>
  </UDashboardPanel>
</template>
