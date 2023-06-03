const defaultMetaData: MetaData = {
  type: "website",
  title: "JournalduCuistot - recettes de cuisine d'un globe trotters",
  description:
    "Bienvenu sur le journal du cuistot, un blog de recettes de cuisine d'un globe trotter",
  robots: "index, follow, max-image-preview:large",
  ogType: "website",
  ogLocale: "fr-FR",
  ogUrl: "https://www.journalducuistot.fr/",
  ogSite_name: "Journal du Cuistot",
  ogTitle: "JournalduCuistot - recettes de cuisine d'un globe trotter",
  ogDescription:
    "Bienvenu sur le journal du cuistot, un blog de recettes de cuisine d'un globe trotter",
  ogImage: "https://www.journalducuistot.fr/img/logo.webp",

  twitterCard: "summary_large_image",

  twitterUrl: "https://www.journalducuistot.fr/",

  twitterTitle: "journalduCuistot - recettes de cuisine d'un globe trotter",

  twitterDescription:
    "Bienvenu sur le journal du cuistot, un blog de recettes de cuisine d'un globe trotter",

  twitterImage: "https://www.journalducuistot.fr/img/logo.webp",
};

export const useLoadMeta = (metaOption: MetaOption) => {
  const metaData: MetaData = {
    type: "",
    title: "",
    description: "",
    robots: "",

    ogType: "",
    ogLocale: "",
    ogLocaleAlternate: "",
    ogUrl: "",
    ogSite_name: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterCard: "",
    twitterUrl: "",
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
    author: "",
    articleDatePublished: "",
  };
  for (const [k, v] of Object.entries(defaultMetaData)) {
    if (k.toLowerCase().includes("title"))
      metaData[k] = metaOption.title + " | JournalduCuistot ";
    if (k.toLowerCase().includes("description"))
      metaData[k] = metaOption.description;
    if (k.toLowerCase().includes("image")) metaData[k] = metaOption.image;
    if (k.toLowerCase().includes("url")) metaData[k] = metaOption.url;

    if (
      !k.toLowerCase().includes("title") &&
      !k.toLowerCase().includes("description") &&
      !k.toLowerCase().includes("image") &&
      !k.toLowerCase().includes("url")
    )
      metaData[k] = v;
  }
  return metaData;
};
