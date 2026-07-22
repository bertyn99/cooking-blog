import type { AppDb } from './create-db'

/** Subset used by query factories inside `db.transaction` callbacks. */
export type DbExecutor = AppDb

export function asAppDb(executor: Parameters<AppDb['transaction']>[0] extends (tx: infer T) => unknown ? T : never): AppDb {
  return executor as unknown as AppDb
}
