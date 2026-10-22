<template>
  <SectionBasicHeader />
  <UMain>
    <UPage>
      <UPageBody :ui="{ base: 'mt-0 pb-0' }">
        <slot />
      </UPageBody>
    </UPage>
  </UMain>
  <LazySectionFooter />
</template>
