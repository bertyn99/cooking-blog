import type { CmsListResponse } from "~/types/cms";
import { serverCmsFind } from "./cms-fetch";
import type { CmsQuery } from "~/utils/cms-query";

const DEFAULT_PAGE_SIZE = 100;

export async function serverCmsFindAll<T>(
  collection: string,
  query: CmsQuery = {},
  pageSize = DEFAULT_PAGE_SIZE,
  headers?: Record<string, string>,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  while (true) {
    const response: CmsListResponse<T> = await serverCmsFind<T>(collection, {
      ...query,
      page,
      pageSize,
    }, headers);

    items.push(...(response.data ?? []));

    const pageCount = response.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) {
      break;
    }
    page += 1;
  }

  return items;
}
