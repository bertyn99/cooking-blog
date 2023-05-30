export const formatUrlCover = (cover: any, size: string) => {
  const { url, width, height } = cover?.data!.attributes.formats[size];
  return url ? process.env.STRAPI_URL + url : process.env.STRAPI_URL;
};

function capitalize(sentence: string): string {
  return sentence
    .split(" ")
    .map((word: string, index: number) => capitalizeFirstLetter(word))
    .join(" ");
}

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
export const truncate = (str: string, n: number) => {
  return str?.toString().replace(new RegExp(`(.{${n - 1}})..+`), "$1...");
};
