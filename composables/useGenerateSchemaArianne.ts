export const useGenerateSchemaArianne = (slug: string | string[]) => {
  if (Array.isArray(slug) && slug.length > 1) {
    console.log(slug);
    console.log(slug[0].replaceAll("-", " "));
    console.log(capitalizeFirstLetter(slug[1].replaceAll("-", " ")));
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
