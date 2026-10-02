// Shim for the `cloudflare:email` runtime module — see
// cloudflare-workers.mjs for why this exists.
const mod = await import(['cloudflare', ':', 'email'].join(''));

export const { EmailMessage } = mod;
