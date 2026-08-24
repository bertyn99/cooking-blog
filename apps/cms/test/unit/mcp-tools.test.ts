import { afterEach, describe, expect, it } from 'vitest'
import { isMcpReadToolName, mcpKillSwitchOff } from '../../server/mcp/utils/enabled'
import {
  contentTypeToScope,
  generationTargetToScope,
  mcpCreateRecipeInput,
  mcpPagination,
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
    expect(isMcpReadToolName('create-article')).toBe(false)
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
  })

  it('maps list rows', () => {
    const result = withWritableList({
      data: [{ status: 'draft' }, { status: 'published' }],
      meta: { page: 1 },
    })
    expect(result.data.map(row => row.writable)).toEqual([true, false])
  })

  it('maps content types to write scopes', () => {
    expect(contentTypeToScope('article')).toBe('articles')
    expect(contentTypeToScope('recipe')).toBe('recipes')
    expect(contentTypeToScope('page')).toBe('pages')
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
})
