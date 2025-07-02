import type { Cover, sizeImg } from "~/types/strapiMeta";

export const useFormatUrlCover = (cover: Cover, size?: string) => {
  const config = useRuntimeConfig();

  const format = cover?.attributes?.formats && size ? cover?.attributes.formats[size] : null;

  if (typeof format !== "undefined" && format !== null) {
    const url = format.url;
    return url
      ? url
      : `${cover?.attributes?.hash}${cover?.attributes?.ext}`;
  }
  return `${cover?.attributes?.hash}${cover?.attributes?.ext}`;
};
