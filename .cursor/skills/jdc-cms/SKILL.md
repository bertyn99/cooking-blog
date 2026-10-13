---
name: jdc-cms
description: Draft and published CMS access for Journal du Cuistot via MCP or REST (articles, recipes, pages, glossary). Use when creating or updating content in apps/cms — never Strapi.
---

# Journal du Cuistot CMS (agent)

## Connection

- **MCP (recommended):** `http://localhost:3001/mcp` with `Authorization: Bearer <your key>`.
- Copy [.cursor/mcp.json.example](../../.cursor/mcp.json.example) → `.cursor/mcp.json` (gitignored) and paste **your own** key. Do not commit `.cursor/mcp.json`. Each developer mints a local key.
- Production: `https://admin.journalducuistot.fr/mcp` (rate-limited; empty tool catalog without a valid `write` key).

Mint a key in the CMS admin under **Clés API & transfert** with scopes:
`articles`, `recipes`, `pages`, `glossary`, `media`, and **`write`**.

## Rules

1. **Never publish** — agents do not publish, unpublish, or schedule. Status stays as-is on update.
2. **Articles, pages, and recipes** — `update-*` works on draft, published, and scheduled rows. `writable` is always `true`. Never change status.
3. **Glossary** — `create-glossary-term` is always **draft + noindex**. `update-glossary-term` does not publish or unpublish. `iconKey` is semantic (`pan`, `pot`…), never an Iconify class (`i-lucide-…`).
4. **Recipe lines** — `ingredients[]` / `utensils[]` take `{ glossaryTermId }` or a `{ name }` stub (creates a draft+noindex term). Affiliate URLs live on the **ustensile glossary term** (`amazonAsin` / `partnerUrl`, partner wins), never on the recipe row. Call `list-glossary-terms` before creating a duplicate. Culinary forms (lait d’amande) are separate terms with `parentId` pointing at the family root; aliases are synonyms only.
5. **Preview** — create/update/get/list return `previewUrl` (site `/preview?type=&slug=`). `publicUrl` is set only when `status=published`. Always give the human `previewUrl` after a change. A glossary term only gets a public `/glossaire/<slug>` path once published.
6. **Comark markdown** — article `content` and recipe `intro` use Comark. Recipe `ingredients[]` / `steps[]` / `utensils[]` are structured fields, not markdown dumps. The public recipe template still reads the `step` markdown string — `create-recipe` MCP takes `steps[]`; set `step` via `update-recipe` if preview does not show directions.
7. **Pages** — `create-page` needs `name` (required). Omit `content` to get the default page-builder seed (`::hero`, intro prose, `::newsletter`). Use `update-page` with Comark section blocks (`::hero`, `::recipe-list`, etc.) and named slots (`#title` under a section). Never set `isHome` unless the human asked for a new homepage.
8. **Locale `fr`** unless specified otherwise.
9. **Categories first** — call `list-article-categories` (articles) or `list-recipe-categories` (recipes) before setting `categoryId`. Cover images: `list-media` → `coverBlobPathname`.
10. **Generation** — `start-generation-run` always creates a **new** draft from pasted markdown (no `articleId`/`recipeId`).
11. **Human publish** — after edits + SEO, stop unless the user asked only for content changes; an editor publishes in the admin UI.

## MCP vs REST

| Use MCP tools | Use REST (`POST/PUT /api/...`) |
|---------------|--------------------------------|
| Cursor / Claude tool calling | Scripts, CI, non-MCP clients |
| Typed tools + prompts | Same draft policy with Bearer key |

REST dual-auth routes (Bearer **or** editor session): articles, recipes, pages, glossary POST/PUT and SEO PUT. API-key writes may edit live rows in place (status unchanged). Agents never publish.

## Out of scope

- Strapi writes
- Delete, publish, schedule, import, maintenance
- Binary media upload via MCP (list metadata only)
