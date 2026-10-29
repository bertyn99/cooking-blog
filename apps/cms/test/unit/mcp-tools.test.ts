import { afterEach, describe, expect, it } from 'vitest'
import type { H3Event } from 'h3'
import { isMcpReadToolName, mcpKillSwitchOff, mcpScheduleToolEnabled } from '../../server/mcp/utils/enabled'
import {
  contentTypeToScope,
  generationTargetToScope,
  mcpCreateRecipeCategoryInput,
  mcpCreateRecipeInput,
  mcpPagination,
  resolveMcpScheduledAt,
  withWritable,
  withWritableList,
} from '../../server/mcp/utils/payload'

describe('mcpKillSwitchOff', () => {
  const original = process.env.CMS_MCP_ENABLED

  afterEach(() => {
    if (original === undefined) delete process.env.CMS_MCP_ENABLED
    else process.env.CMS_MCP_ENABLED = original
  })

  it('is on by default', () => {
    delete process.env.CMS_MCP_ENABLED
    expect(mcpKillSwitchOff()).toBe(false)
  })

  it.each(['0', 'false', 'off', 'FALSE', ' Off '])('treats %j as off', (value) => {
    process.env.CMS_MCP_ENABLED = value
    expect(mcpKillSwitchOff()).toBe(true)
  })
})

describe('isMcpReadToolName', () => {
  it('matches catalog reads only', () => {
    expect(isMcpReadToolName('list-articles')).toBe(true)
    expect(isMcpReadToolName('get-recipe')).toBe(true)
    expect(isMcpReadToolName('list-media')).toBe(true)
    expect(isMcpReadToolName('list-glossary-terms')).toBe(true)
    expect(isMcpReadToolName('list-glossary-icons')).toBe(true)
    expect(isMcpReadToolName('create-article')).toBe(false)
    expect(isMcpReadToolName('create-glossary-term')).toBe(false)
    expect(isMcpReadToolName('upsert-seo')).toBe(false)
    expect(isMcpReadToolName('start-generation-run')).toBe(false)
    expect(isMcpReadToolName('get-out-of-band')).toBe(false)
  })
})

describe('mcp payload helpers', () => {
  it('flags drafts as writable', () => {
    expect(withWritable({ id: 1, status: 'draft' }).writable).toBe(true)
    expect(withWritable({ id: 2, status: 'published' }).writable).toBe(false)
    expect(withWritable({ id: 3, status: 'scheduled' }).writable).toBe(false)
    expect(withWritable({ id: 4, status: 'published' }, { liveEditable: true }).writable).toBe(true)
  })

  it('maps list rows', () => {
    const result = withWritableList({
      data: [{ status: 'draft' }, { status: 'published' }],
      meta: { page: 1 },
    })
    expect(result.data.map(row => row.writable)).toEqual([true, false])
    expect(withWritableList(result, { liveEditable: true }).data.map(row => row.writable)).toEqual([true, true])
  })

  it('maps content types to write scopes', () => {
    expect(contentTypeToScope('article')).toBe('articles')
    expect(contentTypeToScope('recipe')).toBe('recipes')
    expect(contentTypeToScope('page')).toBe('pages')
    expect(contentTypeToScope('glossary')).toBe('glossary')
    expect(generationTargetToScope('article')).toBe('articles')
    expect(generationTargetToScope('recipe')).toBe('recipes')
  })

  it('builds list pagination', () => {
    expect(mcpPagination(3, 20)).toEqual({
      page: 3,
      pageSize: 20,
      offset: 40,
      limit: 20,
    })
  })

  it('exposes recipe ingredients/steps and hides status/step', () => {
    expect(mcpCreateRecipeInput.ingredients).toBeDefined()
    expect(mcpCreateRecipeInput.steps).toBeDefined()
    expect(mcpCreateRecipeInput.status).toBeUndefined()
    expect(mcpCreateRecipeInput.step).toBeUndefined()
  })

  it('exposes category create input without status/publishedAt', () => {
    expect(mcpCreateRecipeCategoryInput.name).toBeDefined()
    expect(mcpCreateRecipeCategoryInput.desc).toBeDefined()
    expect(mcpCreateRecipeCategoryInput.locale).toBeDefined()
    expect(mcpCreateRecipeCategoryInput.status).toBeUndefined()
    expect(mcpCreateRecipeCategoryInput.publishedAt).toBeUndefined()
  })
})

describe('mcpScheduleToolEnabled', () => {
  const original = process.env.CMS_MCP_ENABLED

  afterEach(() => {
    if (original === undefined) delete process.env.CMS_MCP_ENABLED
    else process.env.CMS_MCP_ENABLED = original
  })

  function fakeEvent(scopes: string[]): H3Event {
    return {
      context: {
        actor: {
          kind: 'apiKey',
          apiKey: { scopes },
        },
      },
    } as unknown as H3Event
  }

  it('requires write + content scope + schedule scope', () => {
    expect(mcpScheduleToolEnabled(fakeEvent(['write', 'articles', 'schedule']), 'articles')).toBe(true)
    expect(mcpScheduleToolEnabled(fakeEvent(['write', 'articles']), 'articles')).toBe(false)
    expect(mcpScheduleToolEnabled(fakeEvent(['schedule', 'articles']), 'articles')).toBe(false)
    expect(mcpScheduleToolEnabled(fakeEvent(['write', 'schedule', 'recipes']), 'articles')).toBe(false)
  })

  it('rejects sessions and anonymous requests', () => {
    expect(mcpScheduleToolEnabled({ context: { actor: { kind: 'session' } } } as unknown as H3Event, 'articles')).toBe(false)
    expect(mcpScheduleToolEnabled({ context: {} } as unknown as H3Event, 'articles')).toBe(false)
  })

  it('respects the kill switch', () => {
    process.env.CMS_MCP_ENABLED = 'off'
    expect(mcpScheduleToolEnabled(fakeEvent(['write', 'articles', 'schedule']), 'articles')).toBe(false)
  })
})

describe('resolveMcpScheduledAt', () => {
  it('maps a day key to 09:00 Europe/Paris', () => {
    // Winter (CET, UTC+1): 09:00 Paris = 08:00 UTC.
    expect(new Date(resolveMcpScheduledAt('2026-01-05')).toISOString())
      .toBe('2026-01-05T08:00:00.000Z')
    // Summer (CEST, UTC+2): 09:00 Paris = 07:00 UTC.
    expect(new Date(resolveMcpScheduledAt('2026-07-05')).toISOString())
      .toBe('2026-07-05T07:00:00.000Z')
  })

  it('passes datetimes through as UTC ISO', () => {
    expect(resolveMcpScheduledAt('2026-11-05T14:30:00Z')).toBe('2026-11-05T14:30:00.000Z')
    expect(resolveMcpScheduledAt('2026-11-05T15:30:00+01:00')).toBe('2026-11-05T14:30:00.000Z')
  })

  it('rejects invalid input', () => {
    expect(() => resolveMcpScheduledAt('not-a-date')).toThrow()
    expect(() => resolveMcpScheduledAt('')).toThrow()
  })
})
