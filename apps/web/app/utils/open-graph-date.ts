/** ISO 8601 datetime for Open Graph article:* and Twitter meta. */
export function formatOpenGraphDateTime(value?: string | null): string | undefined {
  const raw = value?.trim();
  if (!raw) {
    return undefined;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}
