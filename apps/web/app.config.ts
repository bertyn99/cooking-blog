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
        base: 'rounded-md font-semibold shadow-sm',
      },
    },
    input: {
      slots: {
        base: 'rounded-md',
      },
    },
  },
})
