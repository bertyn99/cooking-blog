import type { Cover } from "~/types/strapiMeta";
import { toPublicMediaKey, toCmsStoragePath } from "#shared/media-public-path";

export type CoverSource = {
  cover?: Cover | null;
  coverBlobPathname?: string | null;
  slug?: string;
  title?: string;
};

export function formatCoverUrl(
  cover?: Cover | null,
  size?: string,
  coverBlobPathname?: string | null,
): string {
  const format = cover?.formats && size ? cover.formats[size] : null;

  if (format?.url) {
    return toPublicMediaKey(format.url);
  }

  if (cover?.url) {
    return toPublicMediaKey(cover.url);
  }

  if (cover?.hash && cover?.ext) {
    return toPublicMediaKey(`${cover.hash}${cover.ext}`);
  }

  if (coverBlobPathname) {
    return toPublicMediaKey(coverBlobPathname);
  }

  return "";
}

/** @deprecated Use `formatCoverUrl` — kept for existing call sites. */
export const useFormatUrlCover = formatCoverUrl;

export function formatCoverUrlFromSource(
  source?: CoverSource | null,
  size?: string,
): string {
  return formatCoverUrl(source?.cover, size, source?.coverBlobPathname);
}

export function buildCoverUrlTrace(
  source: CoverSource | null | undefined,
  size?: string,
) {
  const cmsRawUrl = source?.cover?.url ?? null;
  const coverBlobPathname = source?.coverBlobPathname ?? null;
  const publicKey = formatCoverUrlFromSource(source ?? undefined, size);
  const cmsStoragePath = publicKey ? toCmsStoragePath(publicKey) : null;
  const config = useRuntimeConfig();
  const cmsBase = String(config.public.cmsBaseUrl || config.public.apiBase || "").replace(
    /\/$/,
    "",
  );

  return {
    slug: source?.slug ?? null,
    title: source?.title ?? null,
    cmsCoverUrl: cmsRawUrl,
    coverBlobPathname,
    publicImageKey: publicKey || null,
    cmsStoragePath,
    cmsFetchUrl: cmsStoragePath && cmsBase ? `${cmsBase}/images/${cmsStoragePath}` : null,
    webProxyExample:
      publicKey
        ? `/images/width_900,height_600,fit_cover,format_webp/${publicKey}`
        : null,
  };
}

export function logCoverResolution(
  label: string,
  source: CoverSource | null | undefined,
  size?: string,
) {
  if (!import.meta.dev) {
    return;
  }
  const trace = buildCoverUrlTrace(source, size);
  if (!trace.publicImageKey) {
    console.warn(`[cover] ${label}: no image key`, trace);
  } else {
    console.debug(`[cover] ${label}`, trace);
  }
}
