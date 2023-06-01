import { Cover, sizeImg } from "~/types/strapiMeta";

export const useFormatUrlCover = (cover: Cover, size: string = "small") => {
  const config = useRuntimeConfig();

  if (cover.data?.attributes?.formats[size]) {
    const format = cover.data?.attributes?.formats[size] as sizeImg;
    console.log(size);
    const url = format?.url;
    return url ? config.public.strapi.url + url : config.public.strapi.url;
  }
  return null;
};
