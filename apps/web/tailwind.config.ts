import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
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
    extend: {
      fontFamily: {
        merriweather: ["Merriweather", "serif"],
        catamaran: ["Catamaran", "sans-serif"],
      },
    },
  },
  plugins: [typography],
} satisfies Config;
