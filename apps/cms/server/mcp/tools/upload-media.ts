import { z } from 'zod'
import { ingestImageBuffer } from '../../utils/ingest-image-buffer'
import { requireMcpMediaTool } from '../utils/actor'
import { mcpMediaListEnabled } from '../utils/enabled'
import { MCP_CREATE } from '../utils/payload'

const MAX_BYTES = 8 * 1024 * 1024

export default defineMcpTool({
  description: `Upload a local image file (base64) into the CMS media library — for agent-generated images (generate locally, then push) or files not on Pexels. Returns pathname (storage key, for coverBlobPathname) and markdownPath (READY for ![alt](markdownPath) — do NOT prepend /uploads/, it already starts with it). Rate limited: 30/min.`,
  annotations: MCP_CREATE,
  inputSchema: {
    fileBase64: z.string().min(1).max(12_000_000).describe('Base64-encoded image bytes (no data: prefix)'),
    contentType: z.enum(['image/webp', 'image/jpeg', 'image/png']).default('image/jpeg'),
    originalName: z.string().trim().min(1).max(200).describe('File name, e.g. pastilla-poulet.webp — dashes, no spaces'),
    altText: z.string().trim().min(1).max(250).describe('French alt text describing the image for the article'),
  },
  enabled: event => mcpMediaListEnabled(event),
  handler: async ({ fileBase64, contentType, originalName, altText }) => {
    const { event } = requireMcpMediaTool()

    const clean = fileBase64.replace(/^data:[^;]+;base64,/, '')
    const buffer = Uint8Array.from(atob(clean), c => c.charCodeAt(0))
    if (!buffer.byteLength || buffer.byteLength > MAX_BYTES) {
      throw createError({ statusCode: 413, statusMessage: 'Fichier vide ou trop volumineux (max 8 Mo).' })
    }

    const ingested = await ingestImageBuffer(event, {
      buffer,
      contentType,
      originalName,
      altText,
      source: 'upload',
    })

    // Markdown-ready path — `pathname` is the storage key (uploads/…) and
    // prepending /uploads/ to it in content yields a double prefix.
    return {
      ...ingested,
      markdownPath: `/uploads/${ingested.pathname.replace(/^uploads\//, '')}`,
    }
  },
})
