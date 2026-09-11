---
name: jdc-cms
description: Draft and published CMS access for Journal du Cuistot via MCP or REST (articles, recipes, pages). Use when creating or updating content in apps/cms — never Strapi.
---

# Journal du Cuistot CMS (agent)

## Connection

- **MCP (recommended):** `http://localhost:3001/mcp` with `Authorization: Bearer <your key>`.
- Copy [.cursor/mcp.json.example](../../.cursor/mcp.json.example) → `.cursor/mcp.json` (gitignored) and paste **your own** key. Do not commit `.cursor/mcp.json`. Each developer mints a local key.
- Production: `https://admin.journalducuistot.fr/mcp` (rate-limited; empty tool catalog without a valid `write` key).

Mint a key in the CMS admin under **Clés API & transfert** with scopes:
`articles`, `recipes`, `pages`, `media`, and **`write`**.

## Rules

1. **Never publish** — agents do not publish, unpublish, or schedule. Status stays as-is on update.
2. **Articles and pages** — `update-article` / `update-page` work on draft, published, and scheduled rows. `writable` is always `true`.
3. **Recipes** — still draft-only. `writable=false` or `403` means the recipe is live; do not update it.
4. **Preview** — create/update/get/list return `previewUrl` (site `/preview?type=&slug=`). `publicUrl` is set only when `status=published`. Always give the human `previewUrl` after a change.
5. **Comark markdown** — article `content` and recipe `intro` use Comark. Recipe `ingredients[]` / `steps[]` / `utensils[]` are structured fields, not markdown dumps.
6. **Locale `fr`** unless specified otherwise.
7. **Categories first** — call `list-article-categories` or `list-recipe-categories` before setting `categoryId`. Cover images: `list-media` → `coverBlobPathname`.
8. **Generation** — `start-generation-run` always creates a **new** draft from pasted markdown (no `articleId`/`recipeId`).
9. **Human publish** — after edits + SEO, stop unless the user asked only for content changes; an editor publishes in the admin UI.

## MCP vs REST

| Use MCP tools | Use REST (`POST/PUT /api/...`) |
|---------------|--------------------------------|
| Cursor / Claude tool calling | Scripts, CI, non-MCP clients |
| Typed tools + prompts | Same draft policy with Bearer key |

REST dual-auth routes (Bearer **or** editor session): articles, recipes, pages POST/PUT and SEO PUT. API-key article/page PUTs may edit live rows in place (status unchanged). Recipe API-key writes stay draft-only.

## Out of scope

- Strapi writes
- Delete, publish, schedule, import, maintenance
- Binary media upload via MCP (list metadata only)
