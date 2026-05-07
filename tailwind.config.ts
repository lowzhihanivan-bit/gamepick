import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#faf8f4", soft: "#f0ede7", card: "#e8e4db" },
        ink: { DEFAULT: "#1c1917", dim: "#6b7280", faint: "#9ca3af" },
        accent: { DEFAULT: "#f59e0b", soft: "#fbbf24" },
        ok: "#047857",
        warn: "#b45309",
        bad: "#dc2626",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
