<template>
  <AppDashboardPanel id="generate">
    <template #header>
      <AppDashboardNavbar title="Génération IA" />
    </template>

    <template #body>
      <div class="mx-auto max-w-3xl space-y-6">
        <UAlert
          color="info"
          variant="subtle"
          title="Agent intégré au CMS"
          description="Collez une source (texte, article, extrait d’ebook). L’agent lit le contenu, interroge Nuxt SEO Pro pour les mots-clés, puis crée un brouillon article ou recette à relire."
        />

        <div class="flex justify-end">
          <UButton
            to="/generate/review"
            color="neutral"
            variant="outline"
            icon="i-lucide-inbox"
          >
            Inbox relecture
          </UButton>
        </div>

        <UPageCard title="Nouvelle génération">
          <GenerationComposerForm />
        </UPageCard>
      </div>
    </template>
  </AppDashboardPanel>
</template>
