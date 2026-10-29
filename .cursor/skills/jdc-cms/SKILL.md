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
`articles`, `recipes`, `pages`, `glossary`, `media`, **`write`** — plus **`schedule`** only if you need MCP planning.

## Rules

1. **Never publish or unpublish** — agents do not publish or unpublish. Status stays as-is on update.
2. **Planification (opt-in)** — with the `schedule` scope, `schedule-{article,recipe,page}` sets `scheduledAt` (the 5-min cron publishes when due; human-review gate still applies at publish time) and `unschedule-{article,recipe,page}` cancels a plan (scheduled → draft). `scheduledAt` takes an ISO datetime or `YYYY-MM-DD` (→ 09:00 Europe/Paris). Published content is refused: publish/unpublish stay manual.
3. **Articles, pages, and recipes** — `update-*` works on draft, published, and scheduled rows. `writable` is always `true`. Never change status.
4. **Glossary** — `create-glossary-term` is always **draft + noindex**. `update-glossary-term` does not publish or unpublish. `iconKey` is semantic (`pan`, `pot`…), never an Iconify class (`i-lucide-…`).
5. **Recipe lines** — `ingredients[]` / `utensils[]` take `{ glossaryTermId }` or a `{ name }` stub (creates a draft+noindex term). Affiliate URLs live on the **ustensile glossary term** (`amazonAsin` / `partnerUrl`, partner wins), never on the recipe row. Call `list-glossary-terms` before creating a duplicate. Culinary forms (lait d’amande) are separate terms with `parentId` pointing at the family root; aliases are synonyms only.
6. **Preview** — create/update/get/list return `previewUrl` (site `/preview?type=&slug=`). `publicUrl` is set only when `status=published`. Always give the human `previewUrl` after a change. A glossary term only gets a public `/glossaire/<slug>` path once published.
7. **Comark markdown** — article `content` and recipe `intro` use Comark. Recipe `ingredients[]` / `steps[]` / `utensils[]` are structured fields, not markdown dumps. The public recipe template still reads the `step` markdown string — `create-recipe` MCP takes `steps[]`; set `step` via `update-recipe` if preview does not show directions.
8. **Pages** — `create-page` needs `name` (required). Omit `content` to get the default page-builder seed (`::hero`, intro prose, `::newsletter`). Use `update-page` with Comark section blocks (`::hero`, `::recipe-list`, etc.) and named slots (`#title` under a section). Never set `isHome` unless the human asked for a new homepage.
9. **Locale `fr`** unless specified otherwise.
10. **Categories first** — call `list-article-categories` (articles) or `list-recipe-categories` (recipes) before setting `categoryId`. Missing recipe category? `create-recipe-category` makes a **draft** category (the human publishes it in the admin). Cover images: `list-media` → `coverBlobPathname`.
11. **Generation** — `start-generation-run` always creates a **new** draft from pasted markdown (no `articleId`/`recipeId`).
12. **Human publish** — after edits + SEO, stop unless the user asked for scheduling or content changes only; an editor publishes in the admin UI.

## MCP vs REST

| Use MCP tools | Use REST (`POST/PUT /api/...`) |
|---------------|--------------------------------|
| Cursor / Claude tool calling | Scripts, CI, non-MCP clients |
| Typed tools + prompts | Same draft policy with Bearer key |

REST dual-auth routes (Bearer **or** editor session): articles, recipes, pages, glossary POST/PUT and SEO PUT. API-key writes may edit live rows in place (status unchanged). Publishing/unpublishing is manual; planning runs through the MCP scheduling tools only.

## Out of scope

- Strapi writes
- Delete, publish, unpublish, import, maintenance (scheduling is allowed via `schedule-*`/`unschedule-*` with the `schedule` scope)
- Binary media upload via MCP (list metadata only)
