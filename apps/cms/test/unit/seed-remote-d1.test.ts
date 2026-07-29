import { afterEach, describe, expect, it } from 'vitest'
import { readRemoteD1Config } from '../../server/db/seed/remote-d1'

describe('readRemoteD1Config', () => {
  const original = {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    databaseId: process.env.D1_DATABASE_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
  }

  afterEach(() => {
    if (original.accountId === undefined) delete process.env.CLOUDFLARE_ACCOUNT_ID
    else process.env.CLOUDFLARE_ACCOUNT_ID = original.accountId

    if (original.databaseId === undefined) delete process.env.D1_DATABASE_ID
    else process.env.D1_DATABASE_ID = original.databaseId

    if (original.apiToken === undefined) delete process.env.CLOUDFLARE_API_TOKEN
    else process.env.CLOUDFLARE_API_TOKEN = original.apiToken
  })

  it('returns null when credentials are incomplete', () => {
    delete process.env.CLOUDFLARE_ACCOUNT_ID
    delete process.env.D1_DATABASE_ID
    delete process.env.CLOUDFLARE_API_TOKEN

    expect(readRemoteD1Config()).toBeNull()
  })

  it('returns config when all credentials are present', () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = 'acct'
    process.env.D1_DATABASE_ID = 'db-id'
    process.env.CLOUDFLARE_API_TOKEN = 'token'

    expect(readRemoteD1Config()).toEqual({
      accountId: 'acct',
      databaseId: 'db-id',
      apiToken: 'token',
    })
  })
})
