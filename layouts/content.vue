<script lang="ts" setup></script>

<template>
  <SectionBasicHeader />
  <div class="max-w-6xl mx-auto mt-20 lg:flex gap-2 px-4 sm:px-10 lg:px-14">
    <main class="w-full lg:w-2/3">
      <slot></slot>
    </main>
    <SectionSidebar />
  </div>
  <SectionFooter />
</template>
