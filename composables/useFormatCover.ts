export const useFormatUrlCover = (cover: any, size: string) => {
  const config = useRuntimeConfig();
  if (cover?.data!.attributes.formats[size]) {
    const { url, width, height } = cover?.data!.attributes.formats[size];
    return url ? config.public.strapi.url + url : config.public.strapi.url;
  }
  return null;
};
