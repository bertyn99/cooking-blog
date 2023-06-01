import { Cover, sizeImg } from "~/types/strapiMeta";

export const useFormatUrlCover = (cover: Cover, size: string = "small") => {
  const config = useRuntimeConfig();

  const format = cover.data?.attributes?.formats[size] || null;
  if (typeof format) {
    const url = format?.url;
    return url ? config.public.strapi.url + url : config.public.strapi.url;
  }
  return null;
};
