import { cmsFind } from "~/utils/cms-client";
import type { CmsFilters, CmsFindOptions } from "~/utils/cms-client";
import type { StrapiResponse } from "~/types/strapiMeta";

/**
 * Fetches published content from `apps/cms` REST API (`/api/*`).
 * Accepts Strapi-style `find()` options for gradual migration.
 */
export function useCms() {
  async function find<T>(
    contentType: string,
    opts: CmsFindOptions = {},
  ): Promise<StrapiResponse<T>> {
    return cmsFind<T>(contentType, opts);
  }

  return { find };
}
