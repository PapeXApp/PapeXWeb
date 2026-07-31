import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          DEFAULT: "var(--primary-navy)",
          mid: "#1e5b82",
          teal: "#2c7da0",
        },
        "light-blue": {
          DEFAULT: "var(--primary-light-blue)",
          200: "#b8daf2",
          300: "#a0d0f0",
          400: "#88c6ee",
          500: "#70bcec",
        },
        orange: {
          DEFAULT: "var(--primary-orange)",
          dark: "var(--primary-orange-dark)",
          deep: "#d35400",
        },
        // Redesign brand palette (docs/design/forked-landing/README.md).
        // Namespaced under `papex-*` on purpose: the bare `navy`/`orange`
        // keys above still point at the OLD palette that the legacy framer
        // landing page and every current page depend on. Do not repoint them.
        papex: {
          navy: "#00121D",
          "navy-raised": "#0a2431",
          "navy-deep": "#04161f",
          "navy-alt": "#0c2937",
          orange: "#EB7100",
          "orange-dark": "#c85f00",
          offwhite: "#F5F5F5",
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        barlow: ["var(--font-barlow)", "Arial", "sans-serif"],
        // Kameron is the redesign's display face. It previously existed only
        // as a raw CSS var applied by a globals.css h1-h6 base rule, with no
        // utility class of its own.
        kameron: ["var(--font-kameron)", "Georgia", "serif"],
        gloock: ["var(--font-gloock)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
