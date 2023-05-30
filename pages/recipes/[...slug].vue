<script lang="ts" setup>
definePageMeta({ layout: "content" });
const { find } = useStrapi();

// set the meta
useSeoMeta(
  useLoadMeta({
    title: capitalize(data.value.article.title),
    description: "Journal du cuistot | " + data.value.article.description,
    image: `https://www.journalducuistot.fr/${data.value.article.image}`,
    url: "https://www.journalducuistot.fr/" + path,
    author: data.value.article.author,
    datePublished: data.value.article.createdAt,
    dateModified: data.value.article.modifiedAt,
  }) as any
);
useHead({
  link: [
    {
      rel: "canonical",
      href: "https://www.journalducuistot.fr/" + path,
    },
  ],
});

const data = [
  {
    name: "Calories",
    value: "200",
    unit: "g",
  },
  {
    name: "Fat",
    value: "200",
    unit: "g",
  },
  {
    name: "TransFat",
    value: "50",
    unit: "g",
  },
  {
    name: "Carbs",
    value: "200",
    unit: "g",
  },
  {
    name: "Protein",
    value: "100",
    unit: "g",
  },
  {
    name: "Sugar",
    value: "100",
    unit: "g",
  },
];
</script>

<template>
  <SectionHeroArticle>
    <template #info>
      <p
        class="items-center mx-2 h-6 text-xs leading-6 font-semibold tracking-widest text-black uppercase align-baseline border-0"
      >
        <Icon name="ic:sharp-access-time" class="h-3 w-3 text-gray-500" />
        30 minutes
      </p>
      <p
        class="items-center mx-2 h-6 text-xs leading-6 font-semibold tracking-widest text-black uppercase align-baseline border-0"
      >
        <Icon name="icon-park-outline:good-two" class="h-3 w-3 text-gray-500" />
        super easy
      </p>
      <p
        class="mx-2 h-6 text-xs leading-6 font-semibold tracking-widest text-black uppercase align-baseline border-0"
      >
        <Icon name="mdi:silverware-fork-knife" class="h-3 w-3 text-gray-500" />
        serves 1
      </p>
      <div
        class="p-0 my-0 mx-2 h-6 text-xs font-semibold tracking-widest text-black uppercase align-baseline border-0"
      >
        <a
          itemprop="url"
          class="p-0 m-0 leading-6 uppercase align-baseline border-0 cursor-pointer hover:text-stone-500"
          href="https://easymeals.qodeinteractive.com/recipe-category/breakfast/"
          style="
            outline: 0px;
            text-decoration: none;
            transition: color 0.2s ease-out 0s;
            background-position: 0px center;
          "
        >
          <Icon name="ion:ios-pricetag-outline" />
          Breakfast
        </a>
      </div>
    </template>
  </SectionHeroArticle>
  <div class="prose md:prose-lg lg:prose-xl">
    Nam aliquam sem et tortor consequat. Odio tempor orci dapibus ultrices in
    iaculis. Vitae proin sagittis nisl rhoncus mattis rhoncus. Sed risus
    ultricies tristique nulla aliquet. Excepteur sint occaecat cupidatat non
    proident, sunt in culpa qui officia deserunt mollit anim id est laborumd ut
    perspiciatis unde omnis iste voluptatem accusantium doloremque laudantium,
    aperiam, eaque.
  </div>
  <RecipeReviews />
  <RecipeIngredients />
  <RecipeNutritional :data="data" />
  <RecipeSteps />
</template>
