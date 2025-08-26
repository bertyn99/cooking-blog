<template>
    <div :class="gridClass">
        <slot />
    </div>
</template>

<script setup lang="ts">

const props = defineProps({
    cols: {
        type: [String, Number],
        default: 2,
    },
})

// On s'assure d'être responsive : 1 colonne sur mobile, puis le nombre de colonnes souhaité sur les écrans plus grands.
const gridClass = computed(() => {
    return `my-6 grid grid-cols-1 md:grid-cols-${props.cols} gap-6 justify-start`
})
</script>

<style>
/* Cible tous les éléments enfants directs du slot pour qu'ils se comportent comme des items de la grille */
.prose .grid>* {
    margin-top: 0;
    margin-bottom: 0;
}
</style>