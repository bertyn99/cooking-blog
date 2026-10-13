<template>
  <ContentListPanel
    title="Glossaire"
    panel-id="glossary"
    endpoint="/api/glossary"
    content-base-path="/glossaire"
    create-label="Nouveau terme"
    show-kind-column
    show-kind-filter
    hide-scheduled-filter
    enable-bulk-actions
    bulk-noun-singular="terme"
    bulk-noun-plural="termes"
  />
</template>
