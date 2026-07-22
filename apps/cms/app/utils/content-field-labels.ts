/** French labels for Strapi-style field keys used in the CMS editor. */
export const CONTENT_FIELD_LABELS: Record<string, string> = {
  name: 'Nom interne',
  title: 'Titre',
  slug: 'Permalien',
  parent: 'Page parente',
  locale: 'Langue',
  category: 'Catégorie',
  difficulty: 'Difficulté',
  time: 'Durée (minutes)',
  cover: 'Image de couverture',
  intro: 'Introduction',
  ingredients: 'Ingrédients',
  ustensiles: 'Ustensiles',
  nutrition: 'Valeurs nutritionnelles',
  step: 'Préparation',
  seo: 'Référencement',
  content: 'Contenu',
}

export function contentFieldLabel(key: string): string {
  return CONTENT_FIELD_LABELS[key] ?? key
}
