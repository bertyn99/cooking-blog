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

/** Absolute site path for Open Graph / meta images from a cover source. */
export function formatCoverOgImagePath(source?: CoverSource | null): string {
  const key = formatCoverUrlFromSource(source);
  if (!key) {
    return "";
  }
  const normalized = key.replace(/^\//, "");
  return `/images/w_1200,h_630,fit_cover,f_webp/${normalized}`;
}

export function buildCoverUrlTrace(
  source: CoverSource | null | undefined,
  size?: string,
  cmsBase?: string,
) {
  const cmsRawUrl = source?.cover?.url ?? null;
  const coverBlobPathname = source?.coverBlobPathname ?? null;
  const publicKey = formatCoverUrlFromSource(source ?? undefined, size);
  const cmsStoragePath = publicKey ? toCmsStoragePath(publicKey) : null;
  const cmsBaseNormalized = cmsBase?.replace(/\/$/, "") ?? "";

  return {
    slug: source?.slug ?? null,
    title: source?.title ?? null,
    cmsCoverUrl: cmsRawUrl,
    coverBlobPathname,
    publicImageKey: publicKey || null,
    cmsStoragePath,
    cmsFetchUrl:
      cmsStoragePath && cmsBaseNormalized
        ? `${cmsBaseNormalized}/images/${cmsStoragePath}`
        : null,
    webProxyExample:
      publicKey
        ? `/images/w_900,h_600,fit_cover,f_webp/${publicKey}`
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
