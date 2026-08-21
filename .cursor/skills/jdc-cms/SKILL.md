---
name: jdc-cms
description: Draft-only CMS access for Journal du Cuistot via MCP or REST (articles, recipes, pages). Use when creating or updating content in apps/cms — never Strapi.
---

# Journal du Cuistot CMS (agent)

## Connection

- **MCP (recommended):** `http://localhost:3001/mcp` with `Authorization: Bearer $CMS_API_KEY`
- Copy [.cursor/mcp.json.example](../../.cursor/mcp.json.example) → `.cursor/mcp.json` and set `CMS_API_KEY` in your environment.
- Production: `https://admin.journalducuistot.fr/mcp` (rate-limited; empty tool catalog without a valid `write` key).

Mint a key in the CMS admin under **Clés API & transfert** with scopes:
`articles`, `recipes`, `pages`, `media`, and **`write`**.

## Rules

1. **Draft-only writes** — agents never publish. `403` on live rows means stop; do not retry with publish.
2. **Read published content** — `list-*` / `get-*` return all statuses. Check `writable: false` before updates.
3. **Comark markdown** — body fields use Comark (same as the CMS editor).
4. **Locale `fr`** unless specified otherwise.
5. **Categories first** — call `list-article-categories` or `list-recipe-categories` before setting `categoryId`.
6. **Generation** — `start-generation-run` always creates a **new** draft from pasted markdown (no `articleId`/`recipeId`).
7. **Human publish** — after draft + SEO, stop; an editor publishes in the admin UI.

## MCP vs REST

| Use MCP tools | Use REST (`POST/PUT /api/...`) |
|---------------|--------------------------------|
| Cursor / Claude tool calling | Scripts, CI, non-MCP clients |
| Typed tools + prompts | Same draft policy with Bearer key |

REST dual-auth routes (Bearer **or** editor session): articles, recipes, pages POST/PUT and SEO PUT.

## Out of scope

- Strapi writes
- Delete, publish, schedule, import, maintenance
- Binary media upload via MCP (list metadata only)
