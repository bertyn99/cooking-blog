<template>
  <ContentListPanel
    title="Articles"
    panel-id="articles"
    endpoint="/api/articles"
    content-base-path="/articles"
    create-label="Nouvel article"
    :show-slug-column="false"
  />
</template>
