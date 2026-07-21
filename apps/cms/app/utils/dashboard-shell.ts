/** Sticky page header chrome (blur, no bottom rule). */
export const DASHBOARD_HEADER_CHROME_CLASS =
  'sticky top-0 z-30 bg-default/95 backdrop-blur-sm supports-[backdrop-filter]:bg-default/80'

/** Shared bordered surface for forms, cards, and editor blocks. */
export const DASHBOARD_SURFACE_CLASS =
  'rounded-lg border border-default/70 bg-default'

export const DASHBOARD_NAVBAR_UI = {
  root: 'border-b-0 min-h-14',
} as const

export const DASHBOARD_TABLE_UI = {
  base: 'table-fixed border-separate border-spacing-0',
  thead: '[&>tr]:bg-elevated/40 [&>tr]:after:content-none',
  tbody: '[&>tr]:last:[&>td]:border-b-0',
  th: 'py-2.5 first:rounded-l-lg last:rounded-r-lg border-y border-default/70 first:border-l last:border-r',
  td: 'border-b border-default/60',
  separator: 'h-0',
} as const

type NavbarUi = Record<string, string | undefined>

export function mergeDashboardNavbarUi(overrides?: NavbarUi): NavbarUi {
  if (!overrides?.root) {
    return { ...DASHBOARD_NAVBAR_UI, ...overrides }
  }
  return {
    ...DASHBOARD_NAVBAR_UI,
    ...overrides,
    root: `${DASHBOARD_NAVBAR_UI.root} ${overrides.root}`.trim(),
  }
}
