export default {
  ui: {
    colors: {
      primary: 'orange',
      neutral: 'stone',
    },
    dashboardNavbar: {
      slots: {
        root:
          'min-h-14 shrink-0 flex items-center justify-between border-b-0 px-2 sm:px-3 gap-2',
        left: 'flex items-center gap-1 min-w-0',
        title:
          'flex items-center gap-1.5 font-semibold text-highlighted truncate text-sm sm:text-base',
        right: 'flex items-center shrink-0 gap-2',
      },
    },
    dashboardPanel: {
      slots: {
        body:
          'flex flex-col gap-4 flex-1 overflow-y-auto bg-muted/15 p-4 sm:p-5',
      },
    },
    dashboardSidebar: {
      slots: {
        root: 'bg-elevated/20',
      },
    },
    pageCard: {
      variants: {
        variant: {
          outline: {
            root: 'bg-default border border-default/70',
            description: 'text-muted',
          },
          subtle: {
            root: 'bg-default border border-default/70',
            description: 'text-toned',
          },
        },
      },
      defaultVariants: {
        variant: 'outline',
      },
    },
    card: {
      slots: {
        root:
          'bg-default border border-default/70 divide-y divide-default rounded-lg',
      },
    },
  },
}
