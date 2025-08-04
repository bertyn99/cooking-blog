<script lang="ts" setup>
import { useReadingTime } from "~/composables/useReadingTime";
import type { Recipe, Article, Category } from "~/types/strapiMeta";
import readingTime from "reading-time";
const { post } = defineProps({
  post: {
    type: Object as PropType<Article>,
    required: true,
  },
});
const category = computed(() => {
  return (post.category) as Category;
});
const cover = useFormatUrlCover(post.cover, "");

const description = computed(() => {
  return post.seo?.length !== 0 &&
    post.seo !== undefined
    ? post.seo[0]?.description
    : "";
});

const fallbackDescription = computed(() => {
  return useMarked(post.content?.substring(0, 200));
});
const responsiveCover = computed(() => {
  const checkIfExist = (img: any, size: string, sizeView: string) => {
    const exist = useFormatUrlCover(img, size);
    if (exist) {
      return `${exist} ${sizeView}`;
    }
    return "";
  };

  return ` ${checkIfExist(post.cover, "thumbnail", "130w")}
                ${checkIfExist(post.cover, "small", "300w")}
                ${checkIfExist(post.cover, "large", "1024w")}
                ${checkIfExist(post.cover, "medium", "768w")}
                ${checkIfExist(post.cover, "meidum", "600w")}
              `;
});
const { minutes } = useReadingTime(post.content || "");
</script>

<template>
  <article class="gap-8 lg:flex-row md:px-9">
    <div
      class="block lg:flex relative justify-center items-center p-0 m-0 leading-6 align-baseline border-0 text-stone-500"
    >
      <div
        class="overflow-hidden flex-grow lg:basis-[44%] flex-shrink p-0 m-0 align-baseline border-0"
      >
        <div class="p-0 m-0 align-baseline border-0">
          <nuxt-link
            itemprop="url"
            :to="`blog/${category?.slug}/${post.slug}`"
            class="p-0 m-0 text-black align-baseline border-0 cursor-pointer hover:text-stone-500"
            style="
              outline: 0px;
              text-decoration: none;
              transition: color 0.2s ease-out 0s;
              background-position: 0px center;
              box-shadow: none;
            "
          >
            <nuxt-img
              provider="localImageSharp"
              :src="cover"
              width="1300"
              height="910"
              fit="cover"
              :alt="post.cover?.alternativeText"
              class="block max-w-full h-auto align-middle rounded-none will-change-transform aspect-[13/9] max-h-[500px]"
              sizes="sm:70vw md:50vw lg:30vw"
            />
          </nuxt-link>
        </div>
      </div>
      <div
        class="flex flex-col justify-center pt-4 lg:pl-12 lg:pr-[4%] m-0 w-full lg:w-7/12 align-baseline"
      >
        <div class="flex items-center p-0 m-0 align-baseline">
          <p
            class="p-0 mt-0 mr-4 mb-2 ml-0 text-xs font-semibold tracking-widest text-black uppercase align-baseline"
          >
            <span
              class="inline-block p -0 mx-0 mt-px mb-0 h-4 tracking-wider leading-5 uppercase align-top"
            ></span>
            {{ minutes }} minutes
          </p>
          <span
            class="p-0 mt-0 mr-4 mb-2 ml-0 text-xs font-medium tracking-widest text-black uppercase align-baseline"
          >
            {{ category?.name }}
          </span>
        </div>
        <h3
          itemprop="name"
          class="p-0 m-0 font-serif text-2xl font-normal text-black align-baseline break-words"
        >
          <NuxtLink
            itemprop="url"
            class="p-0 m-0 align-baseline border-0 cursor-pointer hover:text-stone-500"
            :to="`blog/${category?.slug}/${post.slug}`"
            style="
              outline: 0px;
              text-decoration: none;
              transition: color 0.2s ease-out 0s;
              background-position: 0px center;
              box-shadow: none;
            "
          >
            {{ post.title }}
          </NuxtLink>
        </h3>

        <p
          itemprop="description"
          class="py-0 pl-0 pr-[16%] my-2 mx-0 align-baseline border-0"
        >
          {{ description }}
        </p>
        <!--  <template
          itemprop="description"
          class="py-0 pl-0 pr-[16%] my-2 mx-0 align-baseline border-0"
          v-else
          v-html="fallbackDescription"
        >
        </template> -->
      </div>
    </div>
  </article>
</template>
