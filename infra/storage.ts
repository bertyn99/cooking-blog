import * as Cloudflare from 'alchemy/Cloudflare'
import * as Effect from 'effect/Effect'

export const storage = Effect.gen(function* () {
  const Media = yield* Cloudflare.R2.Bucket('Media')
  const Cache = yield* Cloudflare.KV.Namespace('Cache')

  return { Media, Cache }
})
