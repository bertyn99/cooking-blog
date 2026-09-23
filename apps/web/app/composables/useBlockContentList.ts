import type { Article, Recipe } from "~/types/strapiMeta";

const LIST_LIMIT_CAP = 24;
const RECIPE_INCLUDE = ["cover", "category"] as const;
const ARTICLE_INCLUDE = ["cover", "category"] as const;

function parseLimit(raw: string | number | undefined, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.trunc(n), LIST_LIMIT_CAP);
}

function listQuery(source: string | undefined, category?: string, slugs?: string) {
  if (source === "category" && category) {
    return { categorySlug: category };
  }
  if (source === "slugs" && slugs) {
    const list = slugs.split(",").map(s => s.trim()).filter(Boolean).slice(0, LIST_LIMIT_CAP);
    if (list.length) {
      return { slugs: list };
    }
  }
  return {};
}

export function useBlockRecipeList(props: {
  source?: string;
  category?: string;
  slugs?: string;
  limit?: string | number;
}) {
  const route = useRoute();
  const cms = useCms();
  const limit = computed(() => parseLimit(props.limit, 4));
  const key = computed(
    () =>
      `block:recipe-list:${route.path}:${props.source ?? "latest"}:${props.category ?? ""}:${props.slugs ?? ""}:${limit.value}`,
  );

  return useAsyncData(
    key,
    async () => {
      const result = await cms.recipes({
        ...listQuery(props.source, props.category, props.slugs),
        include: RECIPE_INCLUDE,
        page: 1,
        pageSize: limit.value,
      });
      return result.data ?? [];
    },
    {
      watch: [
        () => props.source,
        () => props.category,
        () => props.slugs,
        () => props.limit,
      ],
    },
  );
}

export function useBlockArticleList(props: {
  source?: string;
  category?: string;
  slugs?: string;
  limit?: string | number;
}) {
  const route = useRoute();
  const cms = useCms();
  const limit = computed(() => parseLimit(props.limit, 5));
  const key = computed(
    () =>
      `block:article-list:${route.path}:${props.source ?? "latest"}:${props.category ?? ""}:${props.slugs ?? ""}:${limit.value}`,
  );

  return useAsyncData(
    key,
    async () => {
      const result = await cms.articles({
        ...listQuery(props.source, props.category, props.slugs),
        include: ARTICLE_INCLUDE,
        page: 1,
        pageSize: limit.value,
      });
      return result.data ?? [];
    },
    {
      watch: [
        () => props.source,
        () => props.category,
        () => props.slugs,
        () => props.limit,
      ],
    },
  );
}
