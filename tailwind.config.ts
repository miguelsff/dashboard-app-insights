import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        azure: {
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
        },
        surface: {
          900: "#0a0f1e",
          800: "#0f1629",
          700: "#1a2340",
          600: "#243058",
        },
      },
    },
  },
  plugins: [],
};
export default config;
