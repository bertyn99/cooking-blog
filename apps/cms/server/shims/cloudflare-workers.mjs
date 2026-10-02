// Shim for the `cloudflare:workers` runtime module.
//
// workerd provides `cloudflare:workers` natively, but nitro's no-externals
// pass cannot bundle that import when it comes from a node_modules
// dependency (the `agents` SDK behind @nuxtjs/mcp-toolkit). This shim is
// resolved in its place (see the `jdc-cms:cloudflare-runtime-modules`
// rollup plugin in nuxt.config.ts) and re-exports the real module through a
// computed dynamic specifier the bundler cannot recurse into — workerd
// resolves it at runtime. Top-level await delays consumers until the real
// module is available, so `class X extends DurableObject` stays safe.
const mod = await import(['cloudflare', ':', 'workers'].join(''));

export const {
  DurableObject,
  RpcTarget,
  RpcStub,
  RpcPromise,
  RpcProperty,
  WorkerEntrypoint,
  WorkflowEntrypoint,
  env,
  exports,
} = mod;
