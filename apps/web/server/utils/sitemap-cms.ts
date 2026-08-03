import type { CmsFindOptions } from "~/utils/cms-client";
import { serverCmsFind } from "./cms-fetch";

const DEFAULT_PAGE_SIZE = 100;

export async function serverCmsFindAll<T>(
  contentType: string,
  opts: Omit<CmsFindOptions, "pagination"> = {},
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  while (true) {
    const response = await serverCmsFind<T>(contentType, {
      ...opts,
      pagination: { page, pageSize },
    });

    items.push(...response.data);

    const pageCount = response.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) {
      break;
    }
    page += 1;
  }

  return items;
}
