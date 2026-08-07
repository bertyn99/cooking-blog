import { log } from 'evlog/client'
import { getErrorCode } from '../../shared/error-code'

type NuxtClientError = {
  code?: string
  docs?: string
  fix?: string
  name?: string
  message?: string
  stack?: string
  why?: string
}

const reportedErrors = new WeakSet<object>()

function serializeError(error: unknown): NuxtClientError {
  const record = error && typeof error === 'object' ? (error as Record<string, unknown>) : undefined
  const serialized: NuxtClientError = {
    ...(typeof record?.code === 'string' ? { code: record.code } : {}),
    ...(typeof record?.docs === 'string' ? { docs: record.docs } : {}),
    ...(typeof record?.fix === 'string' ? { fix: record.fix } : {}),
    ...(typeof record?.name === 'string' ? { name: record.name } : {}),
    ...(typeof record?.message === 'string' ? { message: record.message } : {}),
    ...(typeof record?.stack === 'string' ? { stack: record.stack } : {}),
    ...(typeof record?.why === 'string' ? { why: record.why } : {}),
  }

  const code = getErrorCode(error)
  if (code) serialized.code = code

  if (Object.keys(serialized).length > 0) {
    return serialized
  }
  return { message: String(error) }
}

function reportError(error: unknown, context: Record<string, string>) {
  if (error && typeof error === 'object') {
    if (reportedErrors.has(error)) {
      return
    }
    reportedErrors.add(error)
  }

  const serializedError = serializeError(error)
  log.error({
    source: 'nuxt-client',
    ...context,
    ...(typeof serializedError.code === 'string' ? { errorCode: serializedError.code } : {}),
    error: serializedError,
  })
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('vue:error', (error, _instance, info) => {
    reportError(error, {
      framework: 'vue',
      hook: 'vue:error',
      info,
    })
  })

  nuxtApp.hook('app:error', (error) => {
    reportError(error, {
      framework: 'nuxt',
      hook: 'app:error',
    })
  })
})
