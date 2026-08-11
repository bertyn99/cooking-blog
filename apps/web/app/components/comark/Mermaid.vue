<script lang="ts" setup>
const props = defineProps<{
  content: string;
}>();

const container = ref<HTMLElement | null>(null);
const renderError = ref<string | null>(null);
const diagramId = useId();

onMounted(async () => {
  if (!import.meta.client || !container.value || !props.content?.trim()) {
    return;
  }

  try {
    const { $mermaid } = useNuxtApp();
    const mermaid = await $mermaid();
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      look: "handDrawn",
      fontFamily: "Catamaran, system-ui, sans-serif",
      fontSize: 14,
      securityLevel: "strict",
    });
    const { svg } = await mermaid.render(diagramId, props.content.trim());
    container.value.innerHTML = svg;
  } catch (err) {
    renderError.value =
      err instanceof Error ? err.message : "Failed to render diagram";
  }
});

watch(
  () => props.content,
  async () => {
    if (!import.meta.client || !container.value || !props.content?.trim()) {
      return;
    }
    try {
      const { $mermaid } = useNuxtApp();
      const mermaid = await $mermaid();
      renderError.value = null;
      const { svg } = await mermaid.render(`${diagramId}-w`, props.content.trim());
      container.value.innerHTML = svg;
    } catch (err) {
      renderError.value =
        err instanceof Error ? err.message : "Failed to render diagram";
    }
  },
);
</script>

<template>
  <div class="mermaid w-full flex justify-center">
    <p v-if="renderError" class="text-sm text-red-600" role="alert">
      {{ renderError }}
    </p>
    <div v-else ref="container" />
  </div>
</template>
