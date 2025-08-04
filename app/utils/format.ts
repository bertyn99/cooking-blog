import type { NestedParent } from '~/types/strapiMeta';

function capitalize(sentence: string): string {
  return sentence
    .split(" ")
    .map((word: string, index: number) => capitalizeFirstLetter(word))
    .join(" ");
}

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
 * 
 * @example
 * // For nested data like:
 *  {
 *    slug: "saisir-viande-parfaitement",
 *   parent: {
 *      slug: "methodes-de-cuisson",
 *      parent: {
 *        slug: "techniques-culinaires"
 *      }
 *    }
 *  }
 *  generateSlug("saisir-viande-parfaitement", parent)
 * // Returns: "/techniques-culinaires/methodes-de-cuisson/saisir-viande-parfaitement"
 */
export const generateSlug = (str: string, parent: NestedParent | null | undefined): string => {
  if (!parent?.slug) {
    return `/${str}`;
  }

  // Recursively build the path from root to current
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

