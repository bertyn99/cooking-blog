/** Published homepage seed (Accueil). */
export const HOME_PAGE_MARKDOWN = `::hero{image="/img/hero.jpg" alt="Cuisine africaine maison" ctaHref="/recette" ctaSecondaryHref="/blog"}
#title
Cuisine africaine, recettes de saison
#description
Plats du quotidien, techniques et notes de fourneau — des recettes qu’on refait vraiment, sans catalogue interminable.
#cta
Voir les recettes
#cta-secondary
Lire le journal
::

::person{image="/img/author.jpg" alt="Portrait du cuistot" href="/a-propos"}
#heading
Un journal de cuistot, pas une usine à recettes
#body
Ici on cuisine l’Afrique au rythme des saisons : sauces, grillades, pains, jus. Julius écrit ce qu’il teste à la maison — les gestes, les produits, et le pourquoi des plats, pas seulement la liste d’ingrédients.
#cta
Lire le manifeste
::

::hubs{recipesHref="/recette" techniquesHref="/techniques-culinaires" africaHref="/recettes-du-monde" journalHref="/blog"}
#title
Explorer le journal
::

::recipe-list{source="latest" limit="4"}
#title
Incontournables
::

::article-list{source="latest" limit="5"}
#title
Derniers articles
::

::newsletter
::`

/**
 * Starter Comark for new CMS pages (MCP create-page, admin “Nouvelle page”).
 * Renders hero, intro prose, and newsletter in the page builder.
 */
export const DEFAULT_NEW_PAGE_MARKDOWN = `::hero{image="/img/hero.jpg"}
::

## Introduction

Ajoutez votre texte ici.

::newsletter
::`

export function resolveNewPageContent(content?: string | null): string {
  const trimmed = String(content ?? '').trim()
  return trimmed || DEFAULT_NEW_PAGE_MARKDOWN
}
