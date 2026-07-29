/**
 * Minimal D1Database adapter for Node-side seeding against Cloudflare D1 HTTP API.
 * Used by the admin seeder when run via Alchemy `Command.Exec` (deploy / dev).
 */
import type { D1Database, D1PreparedStatement, D1Result } from '@cloudflare/workers-types'

type QueryResponse = {
  success: boolean
  errors?: Array<{ message: string }>
  result?: Array<{
    results?: unknown[]
    meta?: Record<string, unknown>
  }>
}

export interface RemoteD1Config {
  accountId: string
  databaseId: string
  apiToken: string
}

function assertSuccess(body: QueryResponse, sql: string): D1Result {
  if (!body.success) {
    const message = body.errors?.map(error => error.message).join('; ')
      || 'Unknown D1 query error'
    throw new Error(`D1 query failed (${sql}): ${message}`)
  }

  const first = body.result?.[0]
  return {
    success: true,
    results: first?.results ?? [],
    meta: first?.meta ?? {},
  } as D1Result
}

class RemotePreparedStatement implements D1PreparedStatement {
  constructor(
    private readonly config: RemoteD1Config,
    private readonly sql: string,
    private readonly params: unknown[] = []
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    return new RemotePreparedStatement(this.config, this.sql, values)
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    return this.runQuery<T>()
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    return this.runQuery<T>()
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const result = await this.runQuery<Record<string, unknown>>()
    const row = result.results?.[0] ?? null
    if (!row) return null
    if (colName) {
      return (row[colName] as T | undefined) ?? null
    }
    return row as T
  }

  async raw<T = unknown[]>(): Promise<T[]> {
    const result = await this.runQuery<unknown[]>()
    return (result.results ?? []) as T[]
  }

  private async runQuery<T = unknown>(): Promise<D1Result<T>> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/d1/database/${this.config.databaseId}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: this.sql,
          params: this.params,
        }),
      }
    )

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`D1 HTTP ${response.status}: ${text}`)
    }

    const body = await response.json() as QueryResponse
    return assertSuccess(body, this.sql) as D1Result<T>
  }
}

export function createRemoteD1Database(config: RemoteD1Config): D1Database {
  return {
    prepare(query: string): D1PreparedStatement {
      return new RemotePreparedStatement(config, query)
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      const results: D1Result<T>[] = []
      for (const statement of statements) {
        results.push(await (statement as RemotePreparedStatement).all<T>())
      }
      return results
    },
    async exec(query: string): Promise<D1Result> {
      return new RemotePreparedStatement(config, query).all()
    },
    async dump(): Promise<ArrayBuffer> {
      throw new Error('D1 dump is not supported by the remote seed adapter')
    },
  } as D1Database
}

export function readRemoteD1Config(): RemoteD1Config | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim()
  const databaseId = process.env.D1_DATABASE_ID?.trim()
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim()

  if (!accountId || !databaseId || !apiToken) {
    return null
  }

  return { accountId, databaseId, apiToken }
}
