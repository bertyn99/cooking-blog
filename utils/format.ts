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

export const generateSlug = (str: string, parent: any) => {
  return parent?.data?.attributes?.slug
    ? `/${parent?.data?.attributes?.slug}/${str}`
    : `/${str}`;
};
