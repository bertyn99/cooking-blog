<template>
    <Icon :name="name" :class="iconClasses" :aria-label="ariaLabel" v-bind="iconProps" />
</template>

<script setup lang="ts">
import { cn } from '~/utils/format'

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        default: 'currentColor',
    },
    ariaLabel: {
        type: String,
        default: '',
    },
    // Additional props to pass through to Icon component
    class: {
        type: String,
        default: '',
    },
})

// Build icon classes with intelligent merging
const iconClasses = computed(() => {
    return cn(
        // Base styling (minimal defaults)
        'inline-block align-middle',

        // Default size and color (easily overridden)
        'h-4 w-4 text-gray-600 dark:text-gray-400',

        // Hover and transition effects
        'transition-colors duration-200 hover:text-gray-800 dark:hover:text-gray-200',

        // Color handling (separate from user classes for better control)
        props.color && props.color !== 'currentColor' && `text-${props.color}`,

        // User classes last (highest priority)
        props.class
    )
})

// Props to pass through to the Icon component
const iconProps = computed(() => {
    const passThroughProps: Record<string, any> = {}

    // Pass through any additional props that aren't handled above
    return passThroughProps
})
</script>
