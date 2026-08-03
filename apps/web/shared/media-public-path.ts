/** Strip internal storage prefix from CMS/blob paths (server-only mapping). */
export function stripUploadsPrefix(path: string): string {
  return path.replace(/^\/+/, "").replace(/^uploads\//, "");
}

/** Public image key for `/images/...` URLs (no `uploads/` segment). */
export function toPublicMediaKey(path: string): string {
  return stripUploadsPrefix(path);
}

/** Path segment sent to `apps/cms` `/images/{pathname}`. */
export function toCmsStoragePath(publicOrLegacyPath: string): string {
  const key = stripUploadsPrefix(publicOrLegacyPath);
  return key ? `uploads/${key}` : "uploads";
}
