/** French labels for Strapi-style field keys used in the CMS editor. */
export const CONTENT_FIELD_LABELS: Record<string, string> = {
  name: 'Nom interne',
  termName: 'Nom',
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
  metaDescription: 'Meta description',
  keywords: 'Mots-clés',
  metaRobots: 'Meta robots',
  content: 'Contenu',
  kind: 'Type',
  description: 'Chapeau',
  iconKey: 'Icône',
  utensilCategory: 'Famille d’ustensile',
  brand: 'Marque',
  amazonAsin: 'ASIN Amazon',
  partnerUrl: 'Lien partenaire',
  partnerName: 'Nom du partenaire',
  aliases: 'Alias',
  relatedArticle: 'Article lié',
  ingredientFamily: 'Forme de',
}

export function contentFieldLabel(key: string): string {
  return CONTENT_FIELD_LABELS[key] ?? key
}
