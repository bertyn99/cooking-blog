/** Published homepage seed (Accueil). */
export const HOME_PAGE_MARKDOWN = `::hero{image="/img/hero.jpg"}
::

::newsletter
::

::recipe-list{source="latest" limit="4"}
::

::article-list{source="latest" limit="5"}
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
