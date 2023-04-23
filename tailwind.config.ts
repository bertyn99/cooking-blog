/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./storyblok/**/*.{vue,js}",
    "./components/**/*.{vue,js,ts}",
    `./layouts/**/*.vue`,
    "./pages/**/*.vue",
    `./composables/**/*.{js,ts}`,
    `./plugins/**/*.{js,ts}`,
    `./utils/**/*.{js,ts}`,
    `./App.{js,ts,vue}`,
    "./app.{js,ts,vue}",
    `./Error.{js,ts,vue}`,
    `./error.{js,ts,vue}`,
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
