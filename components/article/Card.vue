<script lang="ts" setup>
import { Recipe, Article, Category } from "~/types/strapiMeta";

const { post } = defineProps({
  post: {
    type: Object as PropType<Article>,
    required: true,
  },
});
const categories = computed(() => {
  return (post.attributes?.categories?.data || []) as Category["data"][];
});
const cover = useFormatUrlCover(post.attributes!.cover, "small");
const responsiveCover = computed(() => {
  const checkIfExist = (img: any, size: string, sizeView: string) => {
    const exist = useFormatUrlCover(img, size);
    if (exist) {
      return `${exist} ${sizeView}`;
    }
    return "";
  };

  return ` ${checkIfExist(post.attributes!.cover, "thumbnail", "130w")} 
                ${checkIfExist(post.attributes!.cover, "small", "300w")}
                ${checkIfExist(post.attributes!.cover, "large", "1024w")}
                ${checkIfExist(post.attributes!.cover, "medium", "768w")}
                ${checkIfExist(post.attributes!.cover, "meidum", "600w")}
              `;
});
</script>

<template>
  <article class="relative isolate flex flex-col gap-8 lg:flex-row md:px-9">
    <div
      class="flex flex-wrap relative justify-center items-center p-0 m-0 leading-6 align-baseline border-0 text-stone-500"
    >
      <div
        class="overflow-hidden flex-grow lg:basis-[44%] flex-shrink p-0 m-0 align-baseline border-0"
      >
        <div class="p-0 m-0 align-baseline border-0">
          <nuxt-link
            itemprop="url"
            :to="post.attributes!.slug"
            class="p-0 m-0 text-black align-baseline border-0 cursor-pointer hover:text-stone-500"
            style="
              outline: 0px;
              text-decoration: none;
              transition: color 0.2s ease-out 0s;
              background-position: 0px center;
              box-shadow: none;
            "
          >
            <img
              width="1300"
              height="910"
              :src="cover"
              class="block max-w-full h-auto align-middle rounded-none will-change-transform aspect-[13/9] max-h-[500px]"
              alt="d"
              loading="lazy"
              :srcset="responsiveCover"
              sizes="(max-width: 1300px) 100vw, 1300px"
              style="
                transform: scale(1.01);
                transition: transform 0.3s cubic-bezier(0.76, 0.35, 0.32, 0.79)
                    0s,
                  -webkit-transform 0.3s cubic-bezier(0.76, 0.35, 0.32, 0.79) 0s;
              "
            />
          </nuxt-link>
        </div>
      </div>
      <div
        class="flex flex-col justify-center pt-4 lg:pl-12lg:pr-[4%] m-0 w-full lg:w-7/12 align-baseline"
      >
        <div class="flex items-center p-0 m-0 align-baseline">
          <p
            class="p-0 mt-0 mr-4 mb-2 ml-0 text-xs font-semibold tracking-widest text-black uppercase align-baseline"
          >
            <span
              class="inline-block p-0 mx-0 mt-px mb-0 h-4 tracking-wider leading-5 uppercase align-top"
            ></span>
            30 minutes
          </p>
          <p
            v-for="category in categories"
            class="p-0 mt-0 mr-4 mb-2 ml-0 text-xs font-semibold tracking-widest text-black uppercase align-baseline"
          >
            {{ category!.attributes!.name }}
          </p>
        </div>
        <h3
          itemprop="name"
          class="p-0 m-0 font-serif text-2xl font-normal text-black align-baseline break-words"
        >
          <NuxtLink
            itemprop="url"
            class="p-0 m-0 align-baseline border-0 cursor-pointer hover:text-stone-500"
            :to="'blog/'+post.attributes!.slug"
            style="
              outline: 0px;
              text-decoration: none;
              transition: color 0.2s ease-out 0s;
              background-position: 0px center;
              box-shadow: none;
            "
          >
            {{ post.attributes!.title }}
          </NuxtLink>
        </h3>
        <p
          itemprop="description"
          class="py-0 pl-0 pr-[16%] my-2 mx-0 align-baseline border-0"
        >
          Lorem ipsum dolor sit amet, consectetuipisicing elit, sed do eiusmod
          tempor incididunt ut labore et dolore magna aliqut enim ad mi
        </p>
      </div>
    </div>
  </article>
</template>
