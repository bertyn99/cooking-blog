import type { StrapiResponse } from "~/types/strapiMeta";

export type CmsFilterValue =
  | string
  | { $eq?: string | number; $contains?: string; $in?: string[] }
  | { slug?: { $eq?: string }; name?: { $in?: string[] } };

export type CmsFilters = Record<string, CmsFilterValue>;

export interface CmsFindOptions {
  populate?: string | string[] | Record<string, unknown>;
  filters?: CmsFilters;
  sort?: string[];
  pagination?: { page?: number; pageSize?: number };
  /** Include drafts (preview); requires CMS session — not used on public site */
  status?: "published" | "draft";
}

interface CmsListResponse<T> {
  data?: T[];
  meta?: StrapiResponse<T>["meta"];
}

export function getCmsBaseUrl(): string {
  const config = useRuntimeConfig();
  return (
    config.public.cmsBaseUrl ||
    config.public.apiBase ||
    "http://localhost:3001"
  ).replace(/\/$/, "");
}

function translatePopulate(populate: CmsFindOptions["populate"]): string | undefined {
  if (!populate) return undefined;
  if (populate === "*") return "*";
  if (Array.isArray(populate)) return populate.join(",");
  if (typeof populate === "object") return Object.keys(populate).join(",");
  return undefined;
}

function translateFilters(filters: CmsFilters): Record<string, string> {
  const params: Record<string, string> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;

    if (key === "slug" && typeof value === "object" && "$eq" in value && value.$eq) {
      params.slug = String(value.$eq);
      continue;
    }

    if (key === "parent" && typeof value === "object" && "slug" in value && value.slug?.$eq) {
      params.parentSlug = String(value.slug.$eq);
      continue;
    }

    if (key === "category" && typeof value === "object") {
      if ("slug" in value && value.slug?.$eq) {
        params.categorySlug = String(value.slug.$eq);
      } else if ("name" in value && value.name?.$in?.length) {
        params.categoryNames = value.name.$in.join(",");
      } else if ("$eq" in value && value.$eq !== undefined && value.$eq !== "") {
        params.categoryId = String(value.$eq);
      }
      continue;
    }

    if (key === "title" && typeof value === "object" && "$contains" in value && value.$contains) {
      params.search = String(value.$contains);
      continue;
    }

    if (typeof value === "object" && "$eq" in value && value.$eq !== undefined) {
      params[key] = String(value.$eq);
    } else if (typeof value === "string") {
      params[key] = value;
    }
  }

  return params;
}

export function buildCmsListUrl(
  baseUrl: string,
  contentType: string,
  opts: CmsFindOptions = {},
): string {
  const collection = contentType.split("?")[0]!;
  const params = new URLSearchParams();

  const include = translatePopulate(opts.populate);
  if (include) params.set("include", include);

  const filterParams = translateFilters(opts.filters || {});
  for (const [key, value] of Object.entries(filterParams)) {
    if (value) params.set(key, value);
  }

  if (opts.sort?.length) {
    params.set("sort", opts.sort[0]!.replace(":desc", ""));
  }

  const page = opts.pagination?.page;
  const pageSize = opts.pagination?.pageSize;
  if (page !== undefined && page > 0) params.set("page", String(page));
  if (pageSize !== undefined) params.set("pageSize", String(pageSize));

  const qs = params.toString();
  return `${baseUrl}/api/${collection}${qs ? `?${qs}` : ""}`;
}

export async function cmsFind<T>(
  contentType: string,
  opts: CmsFindOptions = {},
): Promise<StrapiResponse<T>> {
  const baseUrl = getCmsBaseUrl();
  const url = buildCmsListUrl(baseUrl, contentType, opts);
  const response = await $fetch<CmsListResponse<T> | T[]>(url);

  if (!Array.isArray(response) && response.data && response.meta) {
    return response as StrapiResponse<T>;
  }

  const data = Array.isArray(response) ? response : (response.data ?? []);
  const meta =
    (!Array.isArray(response) && response.meta) || {
      pagination: {
        page: opts.pagination?.page || 1,
        pageSize: opts.pagination?.pageSize || data.length || 10,
        pageCount: 1,
        total: data.length,
      },
    };

  return { data, meta };
}
