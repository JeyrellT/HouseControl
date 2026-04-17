import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sage: { DEFAULT: "#A8C090", soft: "#C9DBB5", border: "#7FA071" },
        gold: { DEFAULT: "#D4A84B", soft: "#E9C77E", border: "#A88332" },
        navy: { DEFAULT: "#1E2A44", soft: "#2C3A5A", border: "#101729" },
        smoke: { DEFAULT: "#8B95A8", soft: "#B4BCCB", border: "#5C6678" },
        cream: { DEFAULT: "#F5F2EA", soft: "#FBF9F3", border: "#E2DDCD" },
        status: {
          ok: "#5BB37F",
          warn: "#E0A537",
          critical: "#D9534F",
        },
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        line: "var(--line)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        soft: "0 4px 14px -4px rgba(30,42,68,0.12)",
        elev: "0 10px 30px -10px rgba(30,42,68,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
