<template>
  <figure
    v-if="show"
    ref="root"
    class="jdc-mermaid my-8 w-full overflow-x-auto"
  >
    <slot />
  </figure>
</template>

<script setup lang="ts">
const show = ref(false);
const root = ref<HTMLElement | null>(null);

const { $mermaid } = useNuxtApp();

onMounted(async () => {
  show.value = true;
  try {
    const mermaid = await $mermaid();
    await nextTick();
    if (!root.value) return;
    await mermaid.run({
      nodes: [root.value],
      suppressErrors: true,
    });
  } catch {
    show.value = false;
  }
});
</script>

<style scoped>
.jdc-mermaid :deep(svg) {
  display: block;
  max-width: 100%;
  height: auto;
}

.jdc-mermaid :deep(.node rect),
.jdc-mermaid :deep(.node polygon) {
  rx: 0;
  ry: 0;
}
</style>
