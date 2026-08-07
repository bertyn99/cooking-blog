import type { MetaData, MetaOption } from "~/types/meta";
import { absoluteSiteUrl, siteUrlOrigin } from "~/composables/useSitePageUrl";
import { formatOpenGraphDateTime } from "~/utils/open-graph-date";

export const useLoadMeta = (metaOption: MetaOption): MetaData => {
  const site = useSiteConfig();
  const origin = siteUrlOrigin(site.url);
  const siteName = site.name;
  const brandedTitle = metaOption.title
    ? `${metaOption.title} — ${siteName}`
    : siteName;

  const description =
    metaOption.description || site.description || "";

  const pageUrl = metaOption.url
    ? absoluteSiteUrl(site.url, metaOption.url)
    : `${origin}/`;

  const keywords =
    metaOption.keywords?.length
      ? metaOption.keywords
      : "cuisine du monde, recettes de cuisine, recettes de cuisine du monde";

  const defaultImage = `${origin}/img/logo.webp`;
  const image =
    absoluteSiteUrl(site.url, metaOption.image) || defaultImage;

  const isArticle = Boolean(formatOpenGraphDateTime(metaOption.articleDatePublished));

  const metaData: MetaData = {
    type: isArticle ? "article" : "website",
    title: metaOption.title,
    description,
    robots:
      site.indexable === false
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large",
    keywords,
    ogType: isArticle ? "article" : "website",
    ogLocale: "fr-FR",
    ogLocaleAlternate: "fr-FR",
    ogUrl: pageUrl,
    ogSite_name: siteName,
    ogTitle: brandedTitle,
    ogDescription: description,
    ogImage: image,
    twitterCard: "summary_large_image",
    twitterUrl: pageUrl,
    twitterTitle: brandedTitle,
    twitterDescription: description,
    twitterImage: image,
  };

  if (metaOption.author) {
    metaData.author = metaOption.author;
  }
  const published = formatOpenGraphDateTime(metaOption.articleDatePublished);
  const modified = formatOpenGraphDateTime(metaOption.articleDateModified);
  if (published) {
    metaData.articleDatePublished = published;
  }
  if (modified) {
    metaData.articleDateModified = modified;
  }

  return metaData;
};

export const useApplySeoMeta = (metaOption: MetaOption) => {
  const meta = useLoadMeta(metaOption);
  const {
    articleDatePublished,
    articleDateModified,
    ...rest
  } = meta;

  const filtered = Object.fromEntries(
    Object.entries(rest).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  ) as Parameters<typeof useSeoMeta>[0];

  useSeoMeta({
    ...filtered,
    ...(articleDatePublished
      ? { articlePublishedTime: articleDatePublished }
      : {}),
    ...(articleDateModified
      ? { articleModifiedTime: articleDateModified }
      : {}),
  });
};
