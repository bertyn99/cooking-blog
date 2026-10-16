<script lang="ts" setup>
const props = defineProps<{
  content: string;
}>();

const container = ref<HTMLElement | null>(null);
const renderError = ref<string | null>(null);
const diagramId = useId();

async function draw(id: string) {
  if (!import.meta.client || !container.value || !props.content?.trim()) {
    return;
  }

  try {
    const { $mermaid } = useNuxtApp();
    const mermaid = await $mermaid();
    renderError.value = null;
    const { svg } = await mermaid.render(id, props.content.trim());
    if (container.value) {
      container.value.innerHTML = svg;
    }
  } catch (err) {
    renderError.value =
      err instanceof Error ? err.message : "Le schéma n'a pas pu s'afficher.";
  }
}

onMounted(() => {
  void draw(diagramId);
});

watch(
  () => props.content,
  () => {
    void draw(`${diagramId}-w`);
  },
);
</script>

<template>
  <figure class="jdc-mermaid my-8 w-full overflow-x-auto">
    <p
      v-if="renderError"
      class="text-sm text-red-800"
      role="alert"
    >
      {{ renderError }}
    </p>
    <div
      v-else
      ref="container"
      class="min-h-48 w-full"
    />
  </figure>
</template>

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

.jdc-mermaid :deep(.label),
.jdc-mermaid :deep(.nodeLabel),
.jdc-mermaid :deep(.edgeLabel),
.jdc-mermaid :deep(foreignObject) {
  font-family: Catamaran, ui-sans-serif, system-ui, sans-serif;
}
</style>
