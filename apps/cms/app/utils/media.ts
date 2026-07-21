/** Public URL for a blob stored in R2 (served via CMS /images route). */
export function mediaPublicUrl(pathname: string): string {
  return `/images/${pathname}`
}

export function mediaAltFromPathname(pathname: string): string {
  const base = pathname.split('/').pop() ?? 'image'
  return base.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'image'
}

export function readApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback
  }
  const err = error as {
    data?: { statusMessage?: string, message?: string }
    statusMessage?: string
    message?: string
  }
  return err.data?.statusMessage
    ?? err.data?.message
    ?? err.statusMessage
    ?? err.message
    ?? fallback
}
