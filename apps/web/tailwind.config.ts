import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
  content: [
    "./app/**/*.{vue,js,ts}",
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./composables/**/*.{js,ts}",
    "./plugins/**/*.{js,ts}",
    "./utils/**/*.{js,ts}",
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
