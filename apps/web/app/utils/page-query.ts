import type { LocationQuery } from "vue-router";

export function parsePageQuery(query: LocationQuery, fallback = 1): number {
  const raw = query.page;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const page = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(page) && page >= 1 ? Math.trunc(page) : fallback;
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
