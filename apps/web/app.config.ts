export default defineAppConfig({
  umami: {
    version: 2,
  },
  ui: {
    colors: {
      primary: 'yellow',
      warning: 'yellow',
      info: 'amber',
      error: 'red',
      success: 'green',
      neutral: 'neutral',
    },
    button: {
      slots: {
        base: 'rounded-md font-semibold shadow-sm transition duration-200 active:scale-[0.98]',
      },
    },
    input: {
      slots: {
        base: 'rounded-md',
      },
    },
    pageHero: {
      slots: {
        title: 'font-serif text-4xl sm:text-5xl text-pretty tracking-tight font-bold text-highlighted',
        description: 'text-base sm:text-lg text-toned max-w-[65ch]',
        container: 'flex flex-col py-16 sm:py-20 lg:py-24 gap-10 sm:gap-y-12',
      },
    },
    pageSection: {
      slots: {
        title: 'font-serif text-xl font-normal text-highlighted',
        description: 'text-base text-toned',
        container: 'flex flex-col lg:grid py-12 sm:py-16 lg:py-16 gap-8',
      },
    },
    pageCard: {
      slots: {
        root: 'relative flex rounded-none',
        title: 'font-serif text-2xl font-normal text-pretty text-highlighted',
      },
    },
    pageCTA: {
      slots: {
        root: 'relative isolate rounded-none overflow-hidden',
        title: 'font-serif text-2xl sm:text-3xl font-normal text-pretty tracking-tight text-highlighted',
        container: 'flex flex-col lg:grid px-8 py-12 sm:px-12 sm:py-16 gap-8',
      },
    },
  },
})
