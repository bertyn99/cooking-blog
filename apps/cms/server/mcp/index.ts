import { extractToolNames } from '@nuxtjs/mcp-toolkit/server'
import { tryResolveWriteActor } from '../utils/write-auth'
import { createRequestRateLimiter } from '../utils/rate-limit'
import { useKvStore } from '../utils/kv'
import { getClientIp } from '../utils/client-ip'
import { useDb } from '../utils/db'
import { recordContentAudit } from '../services/content-audit'
import { actorApiKeyId, actorUserId } from '../utils/actor'
import { isMcpReadToolName, mcpKillSwitchOff } from './utils/enabled'

const MCP_RATE = {
  prefix: 'mcp:req',
  maxRequests: 120,
  windowSeconds: 60,
} as const

export default defineMcpHandler({
  middleware: async (event, next) => {
    if (mcpKillSwitchOff(event)) {
      return next()
    }

    await tryResolveWriteActor(event)

    const actor = event.context.actor
    const limiter = createRequestRateLimiter(useKvStore(event), MCP_RATE)
    const bucketKey = actor?.kind === 'apiKey'
      ? `key:${actor.apiKey.id}:${getClientIp(event)}`
      : `ip:${getClientIp(event)}`
    const rate = await limiter.consume(bucketKey)
    if (!rate.allowed) {
      throw createError({ statusCode: 429, message: 'Rate limit exceeded' })
    }

    const response = await next()

    if (actor?.kind === 'apiKey') {
      const tools = await extractToolNames(event)
      const reads = tools.filter(isMcpReadToolName)
      await Promise.all(reads.map(tool =>
        recordContentAudit(useDb(event), {
          actorUserId: actorUserId(actor),
          actorApiKeyId: actorApiKeyId(actor),
          action: 'mcp.tool',
          entityType: 'mcp',
          entityId: tool,
          metadata: { tool, kind: 'read' },
        }).catch(() => undefined),
      ))
    }

    return response
  },
})
