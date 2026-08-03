import { z } from 'zod'

/** Relative site paths or same-origin http(s) URLs — blocks `//`, `javascript:`, etc. */
export const safeHrefSchema = z.string().min(1).superRefine((value, ctx) => {
  const trimmed = value.trim()
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//')) {
      ctx.addIssue({ code: 'custom', message: 'Protocol-relative URLs are not allowed' })
    }
    return
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      if (!['http:', 'https:'].includes(url.protocol)) {
        ctx.addIssue({ code: 'custom', message: 'Only http(s) absolute URLs are allowed' })
      }
    }
    catch {
      ctx.addIssue({ code: 'custom', message: 'Invalid URL' })
    }
    return
  }

  ctx.addIssue({
    code: 'custom',
    message: 'Use a path starting with / or an absolute http(s) URL',
  })
})
