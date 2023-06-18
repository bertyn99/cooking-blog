<script lang="ts" setup>
import { Ingredient } from "~/types/strapiMeta";

//list of ingredients
defineProps<{
  ingredients: Ingredient[];
}>();
const nbPerson = ref(1);
</script>

<template>
  <section class="space-y-6 mb-6">
    <h3
      class="flex items-center p-0 m-0 font-serif text-2xl font-normal leading-6 text-black align-baseline break-words border-0"
    >
      Ingredients

      <span
        class="ml-4 p-0 my-0 w-full h-2 text-xs font-semibold tracking-widest text-black uppercase align-baseline border-solid border-x-0 border-y border-stone-200"
      ></span>
    </h3>
    <div class="flex gap-3">
      <span>Adjust Serving</span>
      <div class="inline-flex gap-2 items-center bg-white">
        <Icon name="mdi:minus" class="h-4 w-4 text-amber-200" />
        <input
          type="number"
          class="w-6 h-6 text-center text-black"
          v-model="nbPerson"
          @click="nbPerson--"
        />
        <Icon
          name="mdi:plus"
          class="h-4 w-4 text-amber-200"
          @click="nbPerson++"
        />
      </div>
    </div>

    <table class="min-w-full divide-y divide-gray-300">
      <tbody class="divide-y divide-gray-200 border-y-2">
        <tr
          v-for="ingredient in ingredients"
          :key="ingredient.name"
          class="divide-x divide-gray-200"
        >
          <RecipeIngredientsElement
            :ingredient="ingredient"
            :multiplicator="nbPerson"
          />
        </tr>
      </tbody>
    </table>
  </section>
</template>
