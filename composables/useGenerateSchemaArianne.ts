export const useGenerateSchemaArianne = (slug: string | string[]) => {
  if (Array.isArray(slug) && slug.length > 1) {
    return [
      { name: "Accueil", item: "/" },
      {
        name: capitalizeFirstLetter(slug[0].replaceAll("-", " ")),
        path: `/${slug[0]}`,
      },
      {
        name: capitalizeFirstLetter(slug[1].replaceAll("-", " ")),
        path: `/${slug[0]}/${slug[1]}`,
      },
    ];
  }

  return [
    { name: "Accueil", item: "/" },
    {
      name: capitalizeFirstLetter(slug[0].replaceAll("-", " ")),
      path: `/${slug}`,
    },
  ];
};
