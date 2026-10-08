/**
 * Pure constants shared by seed scripts and runtime queries — MUST stay free
 * of runtime imports (`@adonisjs/hash`, `#auth-utils`) so the workflows host
 * worker bundle (plain rolldown, no Nitro aliases) can include it.
 */
export const AGENT_USER_EMAIL = 'agent@journalducuistot.internal'
