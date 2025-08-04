import type { Cover, } from "~/types/strapiMeta";

export const useFormatUrlCover = (cover: Cover, size?: string) => {
  const config = useRuntimeConfig();

  const format = cover?.formats && size ? cover?.formats[size] : null;

  if (typeof format !== "undefined" && format !== null) {
    const url = format.url;
    return url
      ? url
      : `${cover?.hash}${cover?.ext}`;
  }
  return `${cover?.hash}${cover?.ext}`;
};
