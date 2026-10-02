// Shim for the `cloudflare:workflows` runtime module — see
// cloudflare-workers.mjs for why this exists.
const mod = await import(['cloudflare', ':', 'workflows'].join(''));

export const {
  WorkflowEntrypoint,
  WorkflowStep,
  NonRetryableError,
} = mod;
