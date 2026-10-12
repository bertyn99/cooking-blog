<script setup lang="ts">
import {
  GLOSSARY_UTENSIL_CATEGORIES,
  GLOSSARY_UTENSIL_CATEGORY_LABELS_FR,
  listGlossaryIcons,
  type GlossaryIconKey,
  type GlossaryUtensilCategory,
} from '#shared/glossary-icons'

const model = defineModel<GlossaryIconKey | null>({ default: null })

const groups = GLOSSARY_UTENSIL_CATEGORIES.map((category: GlossaryUtensilCategory) => ({
  category,
  label: GLOSSARY_UTENSIL_CATEGORY_LABELS_FR[category],
  icons: listGlossaryIcons(category),
}))

function select(key: GlossaryIconKey) {
  model.value = model.value === key ? null : key
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted">
      Une icône parlante, pas un pictogramme générique. Laissez vide si le nom suffit.
    </p>
    <div
      v-for="group in groups"
      :key="group.category"
      class="space-y-2"
    >
      <p class="text-[11px] font-medium uppercase tracking-wide text-muted">
        {{ group.label }}
      </p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="icon in group.icons"
          :key="icon.key"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm ring-1 ring-inset transition-colors"
          :class="model === icon.key
            ? 'bg-primary/10 text-highlighted ring-primary'
            : 'bg-default text-muted ring-default hover:bg-elevated hover:text-highlighted'"
          @click="select(icon.key)"
        >
          <UIcon
            :name="icon.iconify"
            class="size-4"
          />
          <span>{{ icon.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
