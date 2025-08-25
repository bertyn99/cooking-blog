<template>
    <div :class="styles.container">
        <div class="flex-shrink-0">
            <Icon :name="styles.icon" class="h-6 w-6" :class="styles.iconColor" aria-hidden="true" />
        </div>
        <div class="ml-3 flex-1">
            <div class="prose prose-sm prose-neutral dark:prose-invert">
                <slot />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

const props = defineProps({
    type: {
        type: String,
        default: 'info', // info, tip, warning
    },
})

const styles = computed(() => {
    switch (props.type) {
        case 'tip':
            return {
                container: 'bg-yellow-50 border-l-4 border-yellow-400 p-4 my-6 flex rounded-r-md',
                icon: 'heroicons:light-bulb-solid',
                iconColor: 'text-yellow-500',
            }
        case 'warning':
            return {
                container: 'bg-red-50 border-l-4 border-red-400 p-4 my-6 flex rounded-r-md',
                icon: 'heroicons:exclamation-triangle-solid',
                iconColor: 'text-red-500',
            }
        case 'info':
        default:
            return {
                container: 'bg-amber-50 border-l-4 border-amber-400 p-4 my-6 flex rounded-r-md',
                icon: 'heroicons:information-circle-solid',
                iconColor: 'text-amber-500',
            }
    }
})
</script>