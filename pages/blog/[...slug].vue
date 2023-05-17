<script lang="ts" setup>
definePageMeta({ layout: "content" });
import article from "~/assets/article.json";
console.log(article);
const content = useMarked(article.content);
</script>

<template>
  <div>
    <h1
      itemprop="name"
      class="block mb-4 font-serif text-5xl font-normal text-black align-baseline"
    >
      40 Mother’s Day Breakfast and Brunch Recipes
    </h1>
    <Share />
  </div>

  <SectionHeroArticle>
    <template #info>
      <p
        class="flex-[0_0_auto] items-center mx-2 h-6 text-xs leading-6 font-semibold tracking-widest text-black uppercase align-baseline"
      >
        <Icon name="ic:sharp-access-time" class="h-3 w-3 text-gray-500" />
        30 minutes
      </p>

      <div
        class="flex-[0_0_auto] p-0 my-0 mx-2 h-6 text-xs font-semibold tracking-widest text-black uppercase align-baseline"
      >
        <a
          itemprop="url"
          class="p-0 m-0 leading-6 uppercase align-baseline cursor-pointer hover:text-stone-500"
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
  <article class="prose md:prose-lg lg:prose-xl" v-html="content"></article>
</template>
