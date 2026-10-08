import { z } from 'zod'
import {
  downloadPexelsPhoto,
  getPexelsApiKey,
  getPexelsPhotoById,
} from '../../services/stock/pexels'
import { ingestImageBuffer } from '../../utils/ingest-image-buffer'
import { requireMcpMediaTool } from '../utils/actor'
import { mcpMediaListEnabled } from '../utils/enabled'
import { MCP_CREATE } from '../utils/payload'

export default defineMcpTool({
  description: `Import one Pexels photo (id from search-stock-media) into the CMS media library. Deduplicates by stock id. Returns pathname (storage key, for coverBlobPathname) and markdownPath (READY for ![alt](markdownPath) — do NOT prepend /uploads/, it already starts with it). Attribution (photographer, source) is stored automatically; mention Pexels credit when the article requires it. Rate limited: 30/min.`,
  annotations: MCP_CREATE,
  inputSchema: {
    id: z.string().min(1).describe('Pexels photo id from search-stock-media'),
    preferredSize: z.enum(['original', 'large']).default('large')
      .describe('large (~940px) is enough for site rendering'),
  },
  enabled: event => mcpMediaListEnabled(event) && Boolean(getPexelsApiKey()),
  handler: async ({ id, preferredSize }) => {
    const { event } = requireMcpMediaTool()

    const photo = await getPexelsPhotoById(id)
    const { buffer, contentType } = await downloadPexelsPhoto(photo, preferredSize)

    const altText = photo.alt
      || (photo.photographer ? `Photo de ${photo.photographer}` : undefined)

    const ingested = await ingestImageBuffer(event, {
      buffer,
      contentType,
      originalName: `pexels-${id}.webp`,
      altText,
      source: 'pexels',
      stockProvider: 'pexels',
      stockExternalId: id,
      attribution: {
        photographer: photo.photographer,
        photographerUrl: photo.photographerUrl,
        sourceUrl: photo.pageUrl,
        sourceName: 'Pexels',
      },
    })

    // Markdown-ready path — `pathname` is the storage key (uploads/…) and
    // prepending /uploads/ to it in content yields a double prefix.
    return {
      ...ingested,
      markdownPath: `/uploads/${ingested.pathname.replace(/^uploads\//, '')}`,
    }
  },
})
