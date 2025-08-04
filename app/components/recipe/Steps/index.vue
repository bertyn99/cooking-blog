<script lang="ts" setup>
import { marked } from "marked";

const { steps } = defineProps<{
  steps: string[];
}>();

const formatedSteps = steps.map((step) =>
  marked(step.slice(3, -1), { mangle: false })
);

const schemaRecipeSteps = formatedSteps.map((step, index) => ({
  "@type": "HowToStep",
  text: step.slice(3, -5),
}));
</script>

<template>
  <section class="space-y-6 my-6">
    <h3
      class="flex items-center p-0 m-0 font-serif text-2xl font-normal leading-6 text-black align-baseline break-words border-0"
    >
      Directions

      <span
        class="ml-4 p-0 my-0 w-full h-2 text-xs font-semibold tracking-widest text-black uppercase align-baseline border-solid border-x-0 border-y border-stone-200"
      ></span>
    </h3>
  </section>

  <div>
    <SchemaOrgRecipe :recipeInstructions="schemaRecipeSteps" />
    <RecipeStepsContent
      v-for="(step, index) in formatedSteps"
      :index="index + 1"
      :size="steps.length"
      :step="step"
      :key="index"
    />
  </div>
</template>
