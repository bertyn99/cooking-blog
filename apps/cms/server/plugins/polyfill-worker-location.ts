/**
 * Fix `self.location` for the Workers bundle.
 *
 * Nitro's unenv node-compat layer assigns `self.location = { href: "" }` — no
 * `origin`. `@cfworker/json-schema` (imported by the MCP SDK during
 * `initialize`) reads `self.location.origin + self.location.pathname +
 * location.search` at init and only guards against the `"null"` origin, so the
 * missing `origin` throws `TypeError: Invalid URL string.` — turning every
 * `/mcp` request into a 500 while the rest of the app stays healthy.
 *
 * Runs at Nitro startup, before any MCP request can trigger the cfworker
 * module init. Only fills the gap when `origin` is missing so a future unenv
 * fix stays authoritative.
 */
export default defineNitroPlugin(() => {
  const g = globalThis as {
    self?: { location?: { origin?: string } & Record<string, unknown> } & Record<string, unknown>
  }
  if (g.self?.location?.origin) return

  const location = {
    href: 'http://localhost/',
    origin: 'http://localhost',
    protocol: 'http:',
    host: 'localhost',
    hostname: 'localhost',
    port: '',
    pathname: '/',
    search: '',
    hash: '',
  }
  if (g.self) {
    g.self.location = location
  } else {
    g.self = { location }
  }
})
