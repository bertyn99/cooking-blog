import { parseMarkdown } from "comark";
import toc from "comark/plugins/toc";
import type { TocLink } from "comark/plugins/toc";

/**
 * Extract the table of contents (h2/h3) from a Comark markdown source.
 * Must mirror the render pipeline: ids generated here match the heading
 * ids Comark emits, so `#${link.id}` anchors resolve.
 */
export function useMarkdownToc(
  key: string | (() => string),
  content: () => string,
) {
  const { data } = useAsyncData<TocLink[]>(
    key,
    async () => {
      const source = content();
      if (!source?.trim()) return [];
      const doc = await parseMarkdown(source, { plugins: [toc()] });
      const links = (doc.meta?.toc as { links?: TocLink[] } | undefined)?.links;
      return links ?? [];
    },
    { watch: [content] },
  );

  return computed(() => data.value ?? []);
}
