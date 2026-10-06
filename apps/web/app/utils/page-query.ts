import type { LocationQuery } from "vue-router";

export function parsePageQuery(query: LocationQuery, fallback = 1): number {
  const raw = query.page;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value == null || value === "") return fallback;
  if (!/^[1-9]\d*$/.test(String(value))) return fallback;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : fallback;
}

export function listPageLocation(path: string, query: LocationQuery, page: number) {
  const next: LocationQuery = { ...query };
  if (page <= 1) {
    delete next.page;
  }
  else {
    next.page = String(page);
  }
  return { path, query: next };
}
