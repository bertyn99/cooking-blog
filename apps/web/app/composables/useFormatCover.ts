import type { Cover } from "~/types/strapiMeta";
import { toPublicMediaKey } from "#shared/media-public-path";

export const useFormatUrlCover = (cover: Cover | undefined, size?: string) => {
  const format = cover?.formats && size ? cover.formats[size] : null;

  if (format?.url) {
    return toPublicMediaKey(format.url);
  }

  if (cover?.url) {
    return toPublicMediaKey(cover.url);
  }

  if (cover?.hash && cover?.ext) {
    return toPublicMediaKey(`${cover.hash}${cover.ext}`);
  }

  return "";
};
