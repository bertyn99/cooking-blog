export default defineAppConfig({
  ui: {
    colors: {
      // JDC brand — also set as project default by @journalducuistot/shared.
      primary: 'orange',
      warning: 'yellow',
      neutral: 'stone',
    },
    prose: {
      // Nuxt UI ProseCallout (`ui.prose.callout`). Editorial aside, not a dashboard alert:
      // square corners, yellow-800 filet, readable body, no pastel fills.
      callout: {
        slots: {
          base: () =>
            'group relative my-6 flex items-start gap-3 rounded-none border-0 border-s-[3px] border-s-yellow-800 bg-transparent px-5 py-3.5 text-[15px] leading-relaxed text-default last:mb-0 [&_code]:text-sm [&_code]:bg-muted [&_p]:my-0',
          icon: () => 'mt-0.5 size-4 shrink-0 text-yellow-800',
          externalIcon: () => 'size-4 text-yellow-800',
        },
        variants: {
          color: {
            primary: { base: 'border-s-yellow-800 text-default', icon: 'text-yellow-800' },
            secondary: { base: 'border-s-yellow-800 text-default', icon: 'text-yellow-800' },
            success: { base: 'border-s-yellow-800 text-default', icon: 'text-yellow-800' },
            info: { base: 'border-s-yellow-800 text-default', icon: 'text-yellow-800' },
            warning: { base: 'border-s-yellow-800 text-default', icon: 'text-yellow-800' },
            error: { base: 'border-s-yellow-800 text-default', icon: 'text-yellow-800' },
            neutral: { base: 'border-s-yellow-800 bg-transparent text-default', icon: 'text-yellow-800' },
          },
        },
      },
      blockquote: {
        base: 'my-6 border-s-[3px] border-s-yellow-800 ps-5 not-italic text-toned',
      },
      a: {
        base: [
          'text-yellow-800 border-b border-yellow-800/30 hover:border-yellow-800 font-medium',
          'focus-visible:rounded-none outline-yellow-800/25',
        ],
      },
      table: {
        slots: {
          root: 'relative my-8 overflow-x-auto rounded-none',
          base: 'w-full border-separate border-spacing-0 rounded-none',
        },
      },
    },
  },
})
