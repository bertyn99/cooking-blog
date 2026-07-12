type Formats = {
  [key: string]: sizeImg;
  small?: sizeImg;
  large?: sizeImg;
  medium?: sizeImg;
};

type SEO = {
  id?: number;
  description?: string;
  metaRobots?: string;
  keywords?: string;
};

export type sizeImg = {
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: string | null;
  size: number;
  width: number;
  height: number;
};

export type CoverAttributes = {
  alternativeText?: string;
  caption?: string;
  url?: string;
};

export type Cover = {
  id?: number;
  name?: string;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
  formats?: Formats;
  hash?: string;
  ext?: string;
  mime?: string;
  /** Format: float */
  size?: number;
  url?: string;
  previewUrl?: string;
  provider?: string;
  provider_metadata?: unknown;
  folderPath?: string;
  /** Strapi v4 nested attributes */
  attributes?: CoverAttributes;
  /** Format: date-time */
  createdAt?: string;
  /** Format: date-time */
  updatedAt?: string;
};

export type Category = {
  id?: number;
  name?: string;
  slug?: string;
  desc?: string;
  img?: Cover[];
  /** Format: date-time */
  createdAt?: string;
  /** Format: date-time */
  updatedAt?: string;
  /** Format: date-time */
  publishedAt?: string;
  locale?: string;
};

/** Article/recipe category relation with slug for routing */
export type CategoryArticle = Category;

export type Ingredient = {
  id?: number;
  name?: string;
  /** Format: float */
  qty?: number;
  /** @enum {string} */
  unit?:
    | "none"
    | "g"
    | "kg"
    | "l"
    | "cuillère a soupe"
    | "cuillère à café"
    | "tasse";
};

export type Tag = {
  id?: number;
  name?: string;
  /** Format: date-time */
  createdAt?: string;
  /** Format: date-time */
  updatedAt?: string;
  /** Format: date-time */
  publishedAt?: string;
  locale?: string;
};

export type NutritionInfo = Record<string, string | number> & {
  id?: number;
};

export type NutritionItem = {
  name: string;
  value: string | number;
  unit?: string;
};

export type StrapiContentBlock = {
  id?: number | string;
  __component: string;
  [key: string]: unknown;
};

export type StrapiPaginationMeta = {
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
};

export type StrapiResponse<T> = {
  data: T[];
  meta: StrapiPaginationMeta;
};

// Type for nested parent structure
export type NestedParent = {
  id?: number;
  name?: string;
  title?: string;
  slug?: string;
  /** Format: date-time */
  createdAt?: string;
  /** Format: date-time */
  updatedAt?: string;
  /** Format: date-time */
  publishedAt?: string;
  documentId?: string;
  locale?: string;
  parent?: NestedParent; // Recursive type for nested parents
};

export type Page = {
  id?: number;
  title?: string;
  slug?: string;
  content?: StrapiContentBlock[];
  seoMeta?: SEO;
  parent?: NestedParent;
  /** Format: date-time */
  createdAt?: string;
  /** Format: date-time */
  updatedAt?: string;
  /** Format: date-time */
  publishedAt?: string;
  locale?: string;
};

export type Recipe = {
  id?: number;
  title?: string;
  Intro?: string;
  /** Lowercase alias used in templates */
  intro?: string;
  cover?: Cover;
  Ingredient?: Ingredient[];
  /** Lowercase alias used in templates */
  ingredients?: Ingredient[];
  categories?: Category[];
  category?: CategoryArticle;
  seo?: SEO[] | SEO;
  seoMeta?: SEO;
  step?: string;
  tags?: Tag[];
  slug?: string;
  nutrition?: NutritionInfo;
  /** @enum {string} */
  difficulty?: "easy" | "medium" | "hard";
  time?: number;
  /** Format: date-time */
  createdAt?: string;
  /** Format: date-time */
  updatedAt?: string;
  /** Format: date-time */
  publishedAt?: string;
  /** Format: date-time */
  firstPublishedAt?: string;
  locale?: string;
  parent?: NestedParent;
};

export type Article = {
  id?: number;
  content?: string;
  title?: string;
  cover?: Cover;
  categories?: Category[];
  category?: CategoryArticle;
  slug?: string;
  /** Format: date-time */
  createdAt?: string;
  seo?: SEO[] | SEO;
  seoMeta?: SEO;
  /** Format: date-time */
  updatedAt?: string;
  /** Format: date-time */
  publishedAt?: string;
  /** Format: date-time */
  firstPublishedAt?: string;
  locale?: string;
  prev?: Article;
  next?: Article;
  parent?: NestedParent;
};
