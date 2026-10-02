import type { Actor } from '../utils/actor'

declare module 'h3' {
  interface H3EventContext {
    actor?: Actor
  }
}

export {}
