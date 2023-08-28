import { Cover, sizeImg } from "~/types/strapiMeta";

export const useFormatUrlCover = (cover: Cover, size?: string) => {
  const config = useRuntimeConfig();

  const format = cover.data?.attributes?.formats[size] || null;

  if (typeof format !== "undefined" || format !== null) {
    const url = format?.url;
    return url
      ? url
      : `${cover?.data.attributes?.hash}${cover?.data.attributes?.ext}`;
  }
  return `${cover?.data.attributes?.hash}${cover?.data.attributes?.ext}`;
};
