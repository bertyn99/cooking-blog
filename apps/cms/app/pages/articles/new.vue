<template>
  <UDashboardPanel id="article-new">
    <template #header>
      <UDashboardNavbar title="Nouvel article">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <ContentArticleForm />
    </template>
  </UDashboardPanel>
</template>
