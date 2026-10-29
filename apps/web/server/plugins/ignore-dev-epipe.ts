import { defineNitroPlugin } from 'nitropack/runtime'

function isEpipe(error: unknown): boolean {
  return !!error
    && typeof error === 'object'
    && 'code' in error
    && (error as NodeJS.ErrnoException).code === 'EPIPE'
}

/**
 * Alchemy's local proxy closes sockets while Nitro is still piping image
 * bodies. Node 24 treats that EPIPE as fatal and kills the web child.
 */
export default defineNitroPlugin(() => {
  if (!import.meta.dev) return

  process.on('unhandledRejection', (reason) => {
    if (isEpipe(reason)) return
    throw reason
  })

  process.on('uncaughtException', (error) => {
    if (isEpipe(error)) return
    console.error(error)
    process.exit(1)
  })
})
