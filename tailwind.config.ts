import type { Config } from "tailwindcss";

export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-soft": "var(--bg-soft)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: {
          DEFAULT: "var(--ink)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
        },
        hairline: "var(--hairline)",
        "hairline-2": "var(--hairline-2)",
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          300: "var(--brand-300)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "var(--brand-800)",
          900: "var(--brand-900)",
        },
        accent: {
          50: "var(--accent-50)",
          100: "var(--accent-100)",
          300: "var(--accent-300)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
        },
        mint: {
          bg: "var(--mint-bg)",
          300: "var(--mint-300)",
          500: "var(--mint-500)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        arabic: ["var(--font-arabic)"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
        3: "var(--shadow-3)",
      },
      fontSize: {
        "display-xl": ["64px", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-lg": ["48px", { lineHeight: "1.08", letterSpacing: "-0.015em" }],
        "display-md": ["36px", { lineHeight: "1.10", letterSpacing: "-0.01em" }],
        "display-sm": ["26px", { lineHeight: "1.15", letterSpacing: "-0.005em" }],
      },
    },
  },
  plugins: [],
} satisfies Config;
