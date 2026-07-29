import { ofetch } from 'ofetch'

/** Strapi admin URL without trailing slash or `/api` suffix. */
export function normalizeStrapiApiBase(url: string): string {
  return url.trim().replace(/\/$/, '').replace(/\/api$/i, '')
}

/** Origins to try for `/uploads/…` static files (admin vs public site). */
export function strapiUploadOrigins(apiBase: string, extraOrigin?: string): string[] {
  const origins = [
    extraOrigin,
    normalizeStrapiApiBase(apiBase),
    'https://admin.journalducuistot.fr',
    'https://journalducuistot.fr',
  ].filter((value): value is string => Boolean(value?.trim()))

  return [...new Set(origins.map(origin => origin.replace(/\/$/, '')))]
}

async function downloadOnce(
  url: string,
  opts: { token?: string, timeoutMs: number },
): Promise<ArrayBuffer> {
  const headerVariants: (Record<string, string> | undefined)[] = opts.token
    ? [{ Authorization: `Bearer ${opts.token}` }, undefined]
    : [undefined]

  let lastError: unknown

  for (const headers of headerVariants) {
    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(opts.timeoutMs),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }
      return await response.arrayBuffer()
    }
    catch (error) {
      lastError = error
    }

    try {
      return await ofetch<ArrayBuffer>(url, {
        responseType: 'arrayBuffer',
        headers,
        timeout: opts.timeoutMs,
        retry: 1,
      })
    }
    catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error('download failed')
}

export async function fetchStrapiUploadBinary(
  relativeUrl: string,
  opts?: { origins: string[], token?: string, timeoutMs?: number, retries?: number },
): Promise<ArrayBuffer> {
  const path = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`
  const origins = opts?.origins?.length ? opts.origins : ['https://admin.journalducuistot.fr']
  const timeoutMs = opts?.timeoutMs ?? 120_000
  const retries = opts?.retries ?? 3

  let lastError: unknown

  for (const origin of origins) {
    const url = `${origin.replace(/\/$/, '')}${path}`
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await downloadOnce(url, { token: opts?.token, timeoutMs })
      }
      catch (error) {
        lastError = error
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)))
        }
      }
    }
  }

  const detail = formatFetchFailure(lastError)
  throw new Error(`${detail} (${path})`)
}

function formatFetchFailure(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause
    if (cause instanceof Error) {
      return `${error.message} — ${cause.message}`
    }
    if (cause) {
      return `${error.message} — ${String(cause)}`
    }
    return error.message
  }
  return String(error)
}
