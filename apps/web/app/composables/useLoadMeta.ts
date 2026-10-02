import type { MetaData, MetaOption } from "~/types/meta";
import { absoluteSiteUrl, siteUrlOrigin } from "~/composables/useSitePageUrl";
import { formatOpenGraphDateTime } from "~/utils/open-graph-date";

type SiteMeta = ReturnType<typeof useSiteConfig>;

function loadMeta(metaOption: MetaOption, site: SiteMeta): MetaData {
  const origin = siteUrlOrigin(site.url);
  const siteName = site.name;
  const isProductionEnv = site.env === "production";
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
        : metaOption.robots
          ? metaOption.robots
          : site.indexable === true
            ? "index, follow, max-image-preview:large"
            : !isProductionEnv
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
}

export const useLoadMeta = (metaOption: MetaOption): MetaData => {
  return loadMeta(metaOption, useSiteConfig());
};

export const useApplySeoMeta = (metaOption: MaybeRefOrGetter<MetaOption>) => {
  const site = useSiteConfig();
  const meta = computed(() => loadMeta(toValue(metaOption), site));

  useSeoMeta({
    title: () => meta.value.title,
    description: () => meta.value.description,
    robots: () => meta.value.robots,
    keywords: () => meta.value.keywords,
    author: () => meta.value.author,
    ogType: () => meta.value.ogType,
    ogLocale: () => meta.value.ogLocale,
    ogUrl: () => meta.value.ogUrl,
    ogSiteName: () => meta.value.ogSite_name,
    ogTitle: () => meta.value.ogTitle,
    ogDescription: () => meta.value.ogDescription,
    ogImage: () => meta.value.ogImage,
    twitterCard: () => meta.value.twitterCard,
    twitterTitle: () => meta.value.twitterTitle,
    twitterDescription: () => meta.value.twitterDescription,
    twitterImage: () => meta.value.twitterImage,
    articlePublishedTime: () => meta.value.articleDatePublished,
    articleModifiedTime: () => meta.value.articleDateModified,
  });
};
