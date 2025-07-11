type MetaKey =
  | "type"
  | "title"
  | "description"
  | "robots"
  | "author"
  | "articleDatePublished"
  | "ogType"
  | "ogLocale"
  | "ogLocaleAlternate"
  | "ogUrl"
  | "ogSite_name"
  | "ogTitle"
  | "ogDescription"
  | "ogImage"
  | "twitterCard"
  | "twitterUrl"
  | "twitterTitle"
  | "twitterDescription"
  | "twitterImage";
type Meta = { [key: string]: string | undefined };
export interface MetaData extends Meta {
  type: string;
  title: string;
  description: string;
  robots: string;
  keywords?: string;
  author?: string;
  articleDatePublished?: string;
  articleDateModified?: string;
  ogType: string;
  ogLocale: string;
  ogLocaleAlternate: string;
  ogUrl: string;
  ogSite_name: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  twitterUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
}

export type MetaOption = {
  title: string;
  description: string;
  image: string;
  url: string;
  author?: string;
  keywords?: string;
  articleDatePublished?: string;
  articleDateModified?: string;
};
