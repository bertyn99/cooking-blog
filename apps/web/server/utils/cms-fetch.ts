import { buildCmsListUrl } from "~/utils/cms-client";
import type { CmsFindOptions } from "~/utils/cms-client";
import type { StrapiResponse } from "~/types/strapiMeta";

export function getServerCmsBaseUrl(): string {
  return (
    process.env.NUXT_PUBLIC_CMS_BASE_URL ||
    process.env.STRAPI_URL ||
    "http://localhost:3001"
  ).replace(/\/$/, "");
}

export async function serverCmsFind<T>(
  contentType: string,
  opts: CmsFindOptions = {},
): Promise<StrapiResponse<T>> {
  const baseUrl = getServerCmsBaseUrl();
  const url = buildCmsListUrl(baseUrl, contentType, opts);
  const response = await $fetch<{ data: T[]; meta: StrapiResponse<T>["meta"] }>(url);
  return {
    data: response.data ?? [],
    meta: response.meta ?? {
      pagination: { page: 1, pageSize: 10, pageCount: 1, total: 0 },
    },
  };
}
