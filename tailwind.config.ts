import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0f1113",
        panel: "#17191c",
        "panel-2": "#1d2024",
        line: "#2a2d33",
        gold: {
          DEFAULT: "#c5a572",
          soft: "#d8bd8e",
          deep: "#a8884e",
        },
        ink: "#e9e8e3",
        muted: "#8a8e96",
        success: "#7fb383",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', "Georgia", "serif"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
