<template>
  <ContentListPanel
    title="Recettes"
    panel-id="recipes"
    endpoint="/api/recipes"
    content-base-path="/recipes"
    create-label="Nouvelle recette"
    enable-bulk-actions
    bulk-noun-singular="recette"
    bulk-noun-plural="recettes"
    bulk-noun-feminine
  />
</template>
