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
      },
      fontFamily: {
        barlow: ["var(--font-barlow)", "Arial", "sans-serif"],
        gloock: ["var(--font-gloock)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
