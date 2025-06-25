<script lang="ts" setup>
const someErrorLogger = (_error: any) => {
  console.error(_error);
};
</script>

<template>
  <SectionBasicHeader />
  <div class="max-w-7xl mx-auto mt-24 lg:flex gap-8  px-7 sm:px-5">
    <main class="w-full lg:w-3/4 print:block">
      <NuxtErrorBoundary @error="someErrorLogger">
        <template #default>
          <slot></slot>

          <SectionComments />
        </template>
      </NuxtErrorBoundary>
    </main>
    <SectionSidebar class="print:hidden" />
  </div>

  <LazySectionFooter />
</template>
