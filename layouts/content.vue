<script lang="ts" setup></script>

<template>
  <SectionBasicHeader />
  <div class="max-w-6xl mx-auto mt-20 lg:flex gap-8 px-4 sm:px-10 lg:px-14">
    <main class="w-full lg:w-2/3 print:block">
      <NuxtErrorBoundary @error="someErrorLogger">
        <template #default>
          <slot></slot>

          <SectionComments />
        </template>
      </NuxtErrorBoundary>
    </main>
    <SectionSidebar class="print:hidden" />
  </div>

  <SectionFooter />
</template>
