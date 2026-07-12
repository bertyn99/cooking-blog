    <template>
    <div v-if="show" class="mermaid w-full">
      <slot />
    </div>
  </template>

  <script setup>
  const show = ref(false)

  const { $mermaid } = useNuxtApp()

  onMounted(async () => {
    show.value = true
    try {
      $mermaid().initialize({ 
      startOnLoad: true,
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
        curve: 'basis'
      },
      themeVariables: {
        // Main colors - Yellow/Amber palette
        primaryColor: '#fbbf24',           // Amber-400
        primaryTextColor: '#92400e',       // Amber-800
        primaryBorderColor: '#f59e0b',     // Amber-500
        lineColor: '#f59e0b',              // Amber-500
        
        // Background colors - Zinc palette
        background: '#fafafa',              // Zinc-50
        secondaryColor: '#fef3c7',         // Amber-100
        tertiaryColor: '#fefce8',          // Amber-50
        
        // Node colors
        nodeBkg: '#fbbf24',                // Amber-400
        nodeBorder: '#f59e0b',             // Amber-500
        clusterBkg: '#fef3c7',             // Amber-100
        clusterBorder: '#f59e0b',          // Amber-500
        
        // Text colors
        textColor: '#92400e',               // Amber-800
        titleColor: '#78350f',              // Amber-900
        labelColor: '#92400e',              // Amber-800
        
        // Edge colors
        edgeLabelBackground: '#fefce8',     // Amber-50
        edgeLabelColor: '#92400e',          // Amber-800
        
        // Special elements
        noteBkgColor: '#fef3c7',           // Amber-100
        noteBorderColor: '#f59e0b',        // Amber-500
        noteTextColor: '#92400e',          // Amber-800
        
        // Error states
        errorBkgColor: '#fee2e2',          // Red-100
        errorTextColor: '#dc2626',          // Red-600
        
        // Additional colors for different node types
        actorBkg: '#fbbf24',               // Amber-400
        actorBorder: '#f59e0b',            // Amber-500
        actorTextColor: '#92400e',         // Amber-800
        actorLineColor: '#f59e0b',         // Amber-500
        
        signalColor: '#f59e0b',            // Amber-500
        signalTextColor: '#92400e',        // Amber-800
        
        labelBoxBkgColor: '#fef3c7',       // Amber-100
        labelBoxBorderColor: '#f59e0b',    // Amber-500
        labelTextColor: '#92400e',         // Amber-800
        
        loopTextColor: '#92400e',          // Amber-800
        
        sectionBkgColor: '#fef3c7',        // Amber-100
        sectionBkgColor2: '#fefce8',       // Amber-50
        sectionBkgColor3: '#fbbf24',       // Amber-400
        sectionBkgColor4: '#f59e0b',       // Amber-500
        
        // Grid colors
        gridColor: '#e5e7eb',              // Gray-200
        grid2: '#f3f4f6',                  // Gray-100
      },
      maxTextSize: 50000,
      maxEdges: 1000
    })
    await nextTick()
    $mermaid().init()
    } catch (error) {
      console.error('Failed to initialize Mermaid:', error)
      show.value = false
    }
    
  })

  
  </script>