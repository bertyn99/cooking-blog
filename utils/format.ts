export const formatUrlCover = (cover: any, size: string) => {
  const { url, width, height } = cover?.data!.attributes.formats[size];
  return url ? process.env.STRAPI_URL + url : process.env.STRAPI_URL;
};
