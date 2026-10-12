<script lang="ts" setup>
import type { Ingredient } from '~/types/strapiMeta'

defineProps<{
  ingredient: Ingredient
  multiplicator: number
}>()
const isChecked = ref(false);
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
    {{ ingredient.qty ? ingredient.qty * multiplicator : "" }}
    {{ ingredient.unit && ingredient.unit !== "none" ? ingredient.unit : "" }}
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
