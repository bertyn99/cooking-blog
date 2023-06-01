const defaultMetaData: MetaData = {
  type: "website",
  title:
    "JournalduCuistot - your website to learn the web and mobile developpement",
  description:
    "Welcome to JournalduCuistot the website that share with you the key to become a better developper. Come learn with us",
  robots: "index, follow, max-image-preview:large",
  ogType: "website",
  ogLocale: "fr-FR",
  ogUrl: "https://www.journalducuistot.com/",
  ogSite_name: "Journal du Cuistot",
  ogTitle:
    "JournalduCuistot - your website to learn the web and mobile developpement",
  ogDescription:
    "Bienvenu sur le journal du cuistot, un blog de recettes de cuisine d'un globe trotter",
  ogImage: "https://www.journalducuistot.com/img/logo.webp",

  twitterCard: "summary_large_image",

  twitterUrl: "https://www.journalducuistot.com/",

  twitterTitle:
    "journalduCuistot - your website to learn the web and mobile developpement",

  twitterDescription:
    "Bienvenu sur le journal du cuistot, un blog de recettes de cuisine d'un globe trotter",

  twitterImage: "https://www.journalducuistot.com/img/logo.webp",
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
