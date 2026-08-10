<template>
  <div ref="root" v-if="show" class="mermaid w-full">
    <slot />
  </div>
</template>

<script setup lang="ts">
const show = ref(false)
const root = ref<HTMLElement | null>(null)

const { $mermaid } = useNuxtApp()

onMounted(async () => {
  show.value = true
  try {
    const mermaid = await $mermaid()
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      look: 'handDrawn',
      fontFamily: 'Catamaran, system-ui, sans-serif',
      fontSize: 14,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        diagramPadding: 20,
        nodeSpacing: 50,
        rankSpacing: 50,
        curve: 'basis',
      },
      themeVariables: {
        primaryColor: '#fbbf24',
        primaryTextColor: '#92400e',
        primaryBorderColor: '#f59e0b',
        lineColor: '#f59e0b',
        background: '#fafafa',
        secondaryColor: '#fef3c7',
        tertiaryColor: '#fefce8',
        nodeBkg: '#fbbf24',
        nodeBorder: '#f59e0b',
        clusterBkg: '#fef3c7',
        clusterBorder: '#f59e0b',
        textColor: '#92400e',
        titleColor: '#78350f',
        labelColor: '#92400e',
        edgeLabelBackground: '#fefce8',
        edgeLabelColor: '#92400e',
        noteBkgColor: '#fef3c7',
        noteBorderColor: '#f59e0b',
        noteTextColor: '#92400e',
        errorBkgColor: '#fee2e2',
        errorTextColor: '#dc2626',
        actorBkg: '#fbbf24',
        actorBorder: '#f59e0b',
        actorTextColor: '#92400e',
        actorLineColor: '#f59e0b',
        signalColor: '#f59e0b',
        signalTextColor: '#92400e',
        labelBoxBkgColor: '#fef3c7',
        labelBoxBorderColor: '#f59e0b',
        labelTextColor: '#92400e',
        loopTextColor: '#92400e',
        sectionBkgColor: '#fef3c7',
        sectionBkgColor2: '#fefce8',
        sectionBkgColor3: '#fbbf24',
        sectionBkgColor4: '#f59e0b',
        gridColor: '#e5e7eb',
        grid2: '#f3f4f6',
      },
      maxTextSize: 50000,
      maxEdges: 1000,
    })
    await nextTick()
    if (!root.value) return
    await mermaid.run({
      nodes: [root.value],
      suppressErrors: true,
    })
  }
  catch (error) {
    console.error('Failed to initialize Mermaid:', error)
    show.value = false
  }
})
</script>
