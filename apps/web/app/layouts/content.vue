<script lang="ts" setup>
const someErrorLogger = (_error: unknown) => {
  console.error(_error);
};

// Commentaires réservés aux recettes — les pages CMS (hubs, sous-catégories,
// techniques) posent `comments: true` dans definePageMeta pour l'activer.
const route = useRoute();
const showComments = computed(() => Boolean(route.meta.comments));
</script>

<template>
  <SectionBasicHeader />
  <UMain class="pt-[var(--ui-header-height)]">
    <UPage
      class="mx-auto max-w-7xl px-7 sm:px-5"
      :ui="{
        right: 'order-last lg:col-span-2',
      }"
    >
      <UPageBody :ui="{ base: 'mt-0 pb-24 space-y-12' }">
        <NuxtErrorBoundary @error="someErrorLogger">
          <template #default>
            <slot />
            <SectionComments v-if="showComments" />
          </template>
        </NuxtErrorBoundary>
      </UPageBody>
      <template #right>
        <UPageAside
          class="print:hidden"
          :ui="{
            root: 'block overflow-y-auto py-8 lg:max-h-[calc(100vh-var(--ui-header-height))] lg:sticky lg:top-(--ui-header-height) lg:ps-4 lg:-ms-4 lg:pe-6.5',
          }"
        >
          <SectionSidebar />
        </UPageAside>
      </template>
    </UPage>
  </UMain>
  <LazySectionFooter />
</template>
