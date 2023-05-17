<script lang="ts" setup>
definePageMeta({ layout: "content" });
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
</template>
