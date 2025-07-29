type Formats = {
  [key: string]: sizeImg;
  small?: sizeImg;
  large?: sizeImg;
  medium?: sizeImg;
};
type SizeKey = keyof typeof Formats;

type SEO = {
  id?: number;
  description: string;
  metaRobots: string;
  keywords: string;
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
  /** Format: date-time */
  createdAt?: string;
  /** Format: date-time */
  updatedAt?: string;
};

export type Category = {
  id?: number;
  name?: string;
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

export type Recipe = {
  id?: number;
  title?: string;
  Intro?: string;
  cover?: Cover;
  Ingredient?: Ingredient[];
  categories?: Category[];
  seo?: SEO[];
  step?: string;
  tags?: Tag[];
  slug?: string;
  /** @enum {string} */
  difficulty?: "easy" | "medium" | "hard";
  time?: number;
  /** Format: date-time */
  createdAt?: string;
  /** Format: date-time */
  updatedAt?: string;
  /** Format: date-time */
  publishedAt?: string;
  locale?: string;
  parent?: NestedParent; // Add parent field
};

export type Article = {
  id?: number;
  content?: string;
  title?: string;
  cover?: Cover;
  categories?: Category[];
  slug?: string;
  /** Format: date-time */
  createdAt?: string;
  seo?: SEO[];
  /** Format: date-time */
  updatedAt?: string;
  /** Format: date-time */
  publishedAt?: string;
  locale?: string;
  prev?: Article;
  next?: Article;
  parent?: NestedParent; // Add parent field
};
