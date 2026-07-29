export const useGenerateSchemaArianne = (slug: string | string[]) => {
  const slugArray = Array.isArray(slug) ? slug : [slug];
  const first = slugArray[0];
  const second = slugArray[1];

  if (slugArray.length > 1 && first && second) {
    return [
      { name: "Accueil", item: "/" },
      {
        name: capitalizeFirstLetter(first.replaceAll("-", " ")),
        path: `/${first}`,
      },
      {
        name: capitalizeFirstLetter(second.replaceAll("-", " ")),
        path: `/${first}/${second}`,
      },
    ];
  }

  if (!first) {
    return [{ name: "Accueil", item: "/" }];
  }

  return [
    { name: "Accueil", item: "/" },
    {
      name: capitalizeFirstLetter(first.replaceAll("-", " ")),
      path: `/${first}`,
    },
  ];
};
