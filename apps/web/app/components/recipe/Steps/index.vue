<script lang="ts" setup>
const { steps } = defineProps<{
  steps: string[];
}>();

const formatedSteps = await Promise.all(
  steps.map((step) => useComark(step.slice(3, -1))),
);

const stripHtml = (html: string) =>
  html.replace(/<[^>]+>/g, "").trim();

const schemaRecipeSteps = formatedSteps.map((step) => ({
  "@type": "HowToStep",
  text: stripHtml(step),
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
