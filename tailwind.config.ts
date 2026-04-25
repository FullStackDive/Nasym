import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22"
        },
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f"
        },
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          900: "#0b1220",
          950: "#070b14"
        }
      },
      backgroundImage: {
        "brand-radial":
          "radial-gradient(1200px 600px at 10% -10%, rgba(16,185,129,0.18), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(245,158,11,0.14), transparent 60%)",
        "brand-radial-dark":
          "radial-gradient(1200px 600px at 10% -10%, rgba(16,185,129,0.18), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(245,158,11,0.10), transparent 60%)",
        "brand-gradient":
          "linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)",
        "accent-gradient":
          "linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.10)",
        glow: "0 10px 30px -10px rgba(16, 185, 129, 0.45)"
      },
      fontFamily: {
        display: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Inter",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
} satisfies Config;
