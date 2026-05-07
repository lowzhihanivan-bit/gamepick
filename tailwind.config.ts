import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#0b0d10", soft: "#11141a", card: "#161a22" },
        ink: { DEFAULT: "#e8eaee", dim: "#9aa3af", faint: "#5b6472" },
        accent: { DEFAULT: "#f59e0b", soft: "#fbbf24" },
        ok: "#10b981",
        warn: "#f59e0b",
        bad: "#ef4444",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
