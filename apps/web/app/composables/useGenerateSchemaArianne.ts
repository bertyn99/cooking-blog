import { absoluteSiteUrl, siteUrlOrigin } from "~/composables/useSitePageUrl";

export const useGenerateSchemaArianne = (slug: string | string[]) => {
  const site = useSiteConfig();
  const origin = siteUrlOrigin(site.url);
  const slugArray = Array.isArray(slug) ? slug : [slug];
  const first = slugArray[0];
  const second = slugArray[1];

  if (slugArray.length > 1 && first && second) {
    return [
      { name: "Accueil", item: `${origin}/` },
      {
        name: capitalizeFirstLetter(first.replaceAll("-", " ")),
        item: absoluteSiteUrl(site.url, `/${first}`),
      },
      {
        name: capitalizeFirstLetter(second.replaceAll("-", " ")),
        item: absoluteSiteUrl(site.url, `/${first}/${second}`),
      },
    ];
  }

  if (!first) {
    return [{ name: "Accueil", item: `${origin}/` }];
  }

  return [
    { name: "Accueil", item: `${origin}/` },
    {
      name: capitalizeFirstLetter(first.replaceAll("-", " ")),
      item: absoluteSiteUrl(site.url, `/${first}`),
    },
  ];
};
