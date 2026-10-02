import { formatCoverUrlFromSource, buildCoverUrlTrace } from "~/composables/useFormatCover";
import { serverCmsFind } from "../../utils/cms-fetch";

/** Dev-only: compare CMS cover fields → public `/images` URL → CMS fetch URL. */
export default defineEventHandler(async (event) => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 404 });
  }

  const query = getQuery(event);
  const slug = String(query.slug || "");
  const type = String(query.type || "recipes");

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Missing slug query param" });
  }

  const response = await serverCmsFind<Record<string, unknown>>(type, {
    slug,
    include: "*",
    page: 1,
    pageSize: 1,
  });
  const row = response.data?.[0];
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Content not found" });
  }

  const source = {
    cover: row.cover as import("~/types/strapiMeta").Cover | null,
    coverBlobPathname: row.coverBlobPathname as string | null | undefined,
    slug: row.slug as string | undefined,
    title: row.title as string | undefined,
  };

  const trace = buildCoverUrlTrace(source);
  let cmsHead: { ok: boolean; status: number; contentType: string | null } | null = null;

  if (trace.cmsFetchUrl) {
    const head = await fetch(trace.cmsFetchUrl, { method: "HEAD" });
    cmsHead = {
      ok: head.ok,
      status: head.status,
      contentType: head.headers.get("content-type"),
    };
  }

  return {
    type,
    slug,
    publicKey: formatCoverUrlFromSource(source),
    trace,
    cmsHead,
    webProxyPath: trace.webProxyExample,
  };
});
