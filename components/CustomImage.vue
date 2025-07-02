<script lang="ts" setup>
import type { Cover } from "~/types/strapiMeta";

const { cover } = defineProps({
  cover: {
    type: Object as PropType<Cover>,
    required: true,
  },
});
const responsiveCover = computed(() => {
  const checkIfExist = (img: any, size: string, sizeView: string) => {
    const exist = useFormatUrlCover(img, size);
    if (exist) {
      return `${exist} ${sizeView}`;
    }
    return "";
  };

  return ` ${checkIfExist(cover, "thumbnail", "130w")} 
                ${checkIfExist(cover, "small", "300w")}
                ${checkIfExist(cover, "large", "1024w")}
                ${checkIfExist(cover, "medium", "768w")}
                ${checkIfExist(cover, "meidum", "600w")}
              `;
});
const urlCover = useFormatUrlCover(cover);
</script>

<template>
  <nuxt-img
    provider="localImageSharp"
    width="300"
    height="213"
    :src="urlCover"
    class="block max-w-full h-auto align-middle will-change-transform aspect-[13/9] object-cover"
    :alt="cover?.attributes?.alternativeText"
    loading="lazy"
    sizes="sm:60vw md:30vw lg:20vw"
    style="
      transform: scale(1.01);
      transition: transform 0.3s cubic-bezier(0.76, 0.35, 0.32, 0.79) 0s,
        -webkit-transform 0.3s cubic-bezier(0.76, 0.35, 0.32, 0.79) 0s;
    "
  />
</template>
