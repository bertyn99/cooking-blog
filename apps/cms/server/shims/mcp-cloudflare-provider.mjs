/**
 * Cloudflare MCP transport with a correct `route` for agents `createMcpHandler`.
 * Upstream passes `route: ""`, which breaks pathname matching on `/mcp` in production.
 */
import { createMcpTransportHandler } from '@nuxtjs/mcp-toolkit/dist/runtime/server/mcp/providers/types.js'
import { getHeader, toWebRequest } from '@nuxtjs/mcp-toolkit/dist/runtime/server/mcp/compat.js'
import { validateOrigin } from '@nuxtjs/mcp-toolkit/dist/runtime/server/mcp/providers/security.js'
import {
  isSessionInvalidated,
  isSessionInvalidationRequested,
  markSessionInvalidated,
} from '@nuxtjs/mcp-toolkit/dist/runtime/server/mcp/session-state.js'
import config from '#nuxt-mcp-toolkit/config.mjs'

const fallbackCtx = {
  waitUntil: () => {},
  passThroughOnException: () => {},
}

function createJsonRpcErrorResponse(status, code, message) {
  return new Response(JSON.stringify({
    jsonrpc: '2.0',
    error: { code, message },
    id: null,
  }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const mcpRoute = (config.route || '/mcp').replace(/\/$/, '') || '/mcp'

export default createMcpTransportHandler(async (createServer, event) => {
  const securityConfig = config.security ?? {}
  const originError = validateOrigin(event, securityConfig)
  if (originError) return originError

  const sessionId = getHeader(event, 'mcp-session-id')
  if (sessionId && await isSessionInvalidated(sessionId)) {
    return createJsonRpcErrorResponse(404, -32001, 'Session not found')
  }
  if (sessionId && isSessionInvalidationRequested(event)) {
    await markSessionInvalidated(sessionId)
  }

  const server = createServer()
  event.context._mcpServer = server
  const { createMcpHandler } = await import('agents/mcp')
  const handler = createMcpHandler(server, {
    route: mcpRoute,
  })
  const request = toWebRequest(event)
  const cf = event.context.cloudflare
  return handler(request, cf?.env ?? {}, cf?.ctx ?? fallbackCtx)
})
