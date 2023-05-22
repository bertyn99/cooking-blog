<script lang="ts" setup>
const stepss = [
  {
    content: useMarked(
      "#### Make the barbecue sauce (or substitute 3/4 to 1 cup bottled sauce):\n Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem."
    ),
  },
  {
    content: useMarked(
      "#### Cook the chicken (or substitute 2 cups shredded cooked chicken):\n Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem."
    ),
  },
  {
    content: useMarked(
      "#### Mix the chicken with the barbecue sauce::\n Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem."
    ),
  },
];
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
    <RecipeStepsContent
      v-for="(step, index) in stepss"
      :index="index + 1"
      :size="stepss.length"
      :step="step.content"
      :key="index"
    />
  </div>
</template>
