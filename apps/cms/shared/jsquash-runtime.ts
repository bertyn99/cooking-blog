/**
 * @jsquash loads `.wasm` via `fetch(new URL('…', import.meta.url))`.
 * Node's `fetch` does not support `file://`, so codecs fail with "fetch failed".
 * In Node (dev server, CLI), compile WASM from disk and pass `WebAssembly.Module` to `init()`.
 * Browsers and Cloudflare Workers keep the default fetch-based loading.
 */

let ready: Promise<void> | null = null

function isNodeRuntime(): boolean {
  return typeof process !== 'undefined' && process.release?.name === 'node'
}

async function compilePackageWasm(pkgName: string, relativePath: string): Promise<WebAssembly.Module> {
  const { readFileSync } = await import('node:fs')
  const { dirname, join } = await import('node:path')
  const { createRequire } = await import('node:module')
  const require = createRequire(import.meta.url)
  const base = dirname(require.resolve(`${pkgName}/package.json`))
  const bytes = readFileSync(join(base, relativePath))
  return WebAssembly.compile(bytes)
}

async function bootstrapNodeJsquash(): Promise<void> {
  const { simd } = await import('wasm-feature-detect')
  const hasSimd = await simd()

  const [
    webpDec,
    webpEnc,
    jpegDec,
    jpegEnc,
    pngMod,
    resizeMod,
  ] = await Promise.all([
    import('@jsquash/webp/decode'),
    import('@jsquash/webp/encode'),
    import('@jsquash/jpeg/decode'),
    import('@jsquash/jpeg/encode'),
    import('@jsquash/png/decode'),
    import('@jsquash/resize'),
  ])

  const webpEncWasm = hasSimd ? 'codec/enc/webp_enc_simd.wasm' : 'codec/enc/webp_enc.wasm'

  await Promise.all([
    webpDec.init(await compilePackageWasm('@jsquash/webp', 'codec/dec/webp_dec.wasm')),
    webpEnc.init(await compilePackageWasm('@jsquash/webp', webpEncWasm)),
    jpegDec.init(await compilePackageWasm('@jsquash/jpeg', 'codec/dec/mozjpeg_dec.wasm')),
    jpegEnc.init(await compilePackageWasm('@jsquash/jpeg', 'codec/enc/mozjpeg_enc.wasm')),
    pngMod.init(await compilePackageWasm('@jsquash/png', 'codec/pkg/squoosh_png_bg.wasm')),
    resizeMod.initResize(await compilePackageWasm('@jsquash/resize', 'lib/resize/pkg/squoosh_resize_bg.wasm')),
  ])
}

/** Idempotent; safe to call from browser (no-op). */
export function ensureJsquashRuntime(): Promise<void> {
  if (!isNodeRuntime()) {
    return Promise.resolve()
  }
  if (!ready) {
    ready = bootstrapNodeJsquash().catch((error) => {
      ready = null
      throw error
    })
  }
  return ready
}
