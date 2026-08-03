import type { NestedParent } from '~/types/strapiMeta';

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
export const truncate = (str: string, n: number) => {
  return str?.toString().replace(new RegExp(`(.{${n - 1}})..+`), "$1...");
};

/**
 * Extracts the full parent hierarchy as an array
 * @param parent - The parent object (can be nested)
 * @returns Array of parent objects from root to immediate parent
 */
export const getParentHierarchy = (parent: NestedParent | null | undefined): NestedParent[] => {
  if (!parent?.slug) {
    return [];
  }

  const hierarchy: NestedParent[] = [];
  let currentParent: NestedParent | null | undefined = parent;

  while (currentParent?.slug) {
    hierarchy.unshift(currentParent);
    currentParent = currentParent.parent;
  }

  return hierarchy;
};

/**
 * Generates a slug path by recursively traversing the parent hierarchy
 * @param str - The current item's slug
 * @param parent - The parent object (can be nested)
 * @returns The full path from root to current item
 */
export const generateSlug = (str: string, parent: NestedParent | null | undefined): string => {
  if (!parent?.slug) {
    return `/${str}`;
  }

  const buildParentPath = (currentParent: NestedParent | null | undefined): string => {
    if (!currentParent?.slug) {
      return '';
    }

    const parentPath = buildParentPath(currentParent.parent);
    return parentPath ? `${parentPath}/${currentParent.slug}` : currentParent.slug;
  };

  const parentPath = buildParentPath(parent);
  return parentPath ? `/${parentPath}/${str}` : `/${str}`;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
