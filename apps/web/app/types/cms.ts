/** Public CMS HTTP shapes for `apps/web` (not Drizzle, not Strapi). */

export type ContentStatus = "draft" | "published" | "scheduled";

export interface CmsSeoMeta {
  description?: string | null;
  keywords?: string | null;
  metaRobots?: string | null;
}

export interface CmsPageParent {
  slug: string;
  title?: string | null;
  name?: string | null;
  parent?: CmsPageParent | null;
}

export interface CmsPage {
  id?: number;
  name?: string;
  title?: string | null;
  slug?: string;
  content?: string | null;
  excerpt?: string | null;
  parentId?: number | null;
  isHome?: boolean;
  status?: ContentStatus;
  locale?: string;
  seoMeta?: CmsSeoMeta | null;
  parent?: CmsPageParent | null;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
}

export interface CmsPaginationMeta {
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}

export interface CmsListResponse<T> {
  data: T[];
  meta?: CmsPaginationMeta;
}
