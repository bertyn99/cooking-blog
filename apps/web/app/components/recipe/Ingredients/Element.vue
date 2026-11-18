<script lang="ts" setup>
import type { Ingredient } from '~/types/strapiMeta'

const props = defineProps<{
  ingredient: Ingredient
  multiplicator: number
}>()
const isChecked = ref(false);

// Les unités arrivent en enum technique (`cuillere_soupe`) : on les rend en
// français lisible, sinon la liste affiche le code brut.
const UNIT_LABELS: Record<string, string> = {
  g: 'g',
  mg: 'mg',
  kg: 'kg',
  l: 'l',
  ml: 'ml',
  cuillere_soupe: 'c. à soupe',
  cuillere_cafe: 'c. à café',
  'cuillère a soupe': 'c. à soupe',
  'cuillère à café': 'c. à café',
  tasse: 'tasse',
};

const unitLabel = computed(() => {
  const unit = props.ingredient.unit;
  if (!unit || unit === 'none') return '';
  return UNIT_LABELS[unit] ?? unit;
});

const quantity = computed(() => {
  const qty = props.ingredient.qty;
  if (qty === null || qty === undefined || qty === 0) return '';
  const value = Number(qty) * props.multiplicator;
  if (!Number.isFinite(value)) return `${qty}`;
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
});
</script>

<template>
  <td class="whitespace-nowrap py-4 pl-4 text-sm font-medium text-gray-900 w-16">
    <Icon
      name="mdi:checkbox-blank-circle-outline"
      class="h-4 w-4 text-amber-200"
      v-if="!isChecked"
      @click="isChecked = !isChecked"
    />
    <Icon
      name="mdi:check-circle-outline"
      class="h-4 w-4 text-amber-200"
      v-else
      @click="isChecked = !isChecked"
    />
  </td>
  <td
    class="whitespace-nowrap py-4 pl-4 pr-4 text-sm text-gray-500 sm:pr-0"
    :class="{ 'line-through': isChecked }"
  >
    {{ quantity }} {{ unitLabel }}
    <NuxtLink
      v-if="ingredient.path"
      :to="ingredient.path"
      class="text-stone-800 underline decoration-stone-300 hover:text-amber-900"
    >
      {{ ingredient.name }}
    </NuxtLink>
    <template v-else>
      {{ ingredient.name }}
    </template>
    <span
      v-if="ingredient.note"
      class="text-stone-400"
    > ({{ ingredient.note }})</span>
  </td>
</template>
