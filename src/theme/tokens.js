const colorModes = {
  light: {
    base: {
      background: "#f4f7fb",
      backgroundElevated: "#ffffff",
      backgroundSubtle: "#eef3f9",
      backgroundInset: "#e7edf6",
      border: "#d7e1ee",
      borderStrong: "#b9c8dc",
      text: "#142033",
      textMuted: "#5b6b82",
      textSoft: "#7c8aa0",
      accent: "#2563eb",
      accentHover: "#1d4ed8",
      accentSoft: "#dbeafe"
    },
    semantic: {
      success: "#15803d",
      successSoft: "#dcfce7",
      warning: "#b45309",
      warningSoft: "#fef3c7",
      danger: "#b42318",
      dangerSoft: "#fee4e2",
      info: "#0f5fa8",
      infoSoft: "#dbeafe"
    }
  },
  dark: {
    base: {
      background: "#09111c",
      backgroundElevated: "#111b2a",
      backgroundSubtle: "#0f1724",
      backgroundInset: "#142033",
      border: "#243247",
      borderStrong: "#31445f",
      text: "#f5f8fc",
      textMuted: "#b0bfd4",
      textSoft: "#8da0bb",
      accent: "#60a5fa",
      accentHover: "#93c5fd",
      accentSoft: "rgba(96, 165, 250, 0.18)"
    },
    semantic: {
      success: "#5ee38c",
      successSoft: "rgba(94, 227, 140, 0.16)",
      warning: "#f7b955",
      warningSoft: "rgba(247, 185, 85, 0.18)",
      danger: "#ff8a7a",
      dangerSoft: "rgba(255, 138, 122, 0.18)",
      info: "#7cc7ff",
      infoSoft: "rgba(124, 199, 255, 0.18)"
    }
  }
};

const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem"
};

const radius = {
  sm: "0.5rem",
  md: "0.875rem",
  lg: "1.25rem",
  xl: "1.75rem",
  pill: "999px"
};

const shadows = {
  xs: "0 1px 2px rgba(15, 23, 42, 0.06)",
  sm: "0 8px 24px rgba(15, 23, 42, 0.06)",
  md: "0 18px 40px rgba(15, 23, 42, 0.08)",
  lg: "0 28px 72px rgba(15, 23, 42, 0.12)"
};

const typography = {
  fontFamily: {
    sans: '"Sora", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    mono: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace'
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.5rem",
    "2xl": "2rem",
    "3xl": "2.75rem"
  },
  lineHeight: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.7
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
};

const layout = {
  sidebarWidth: "17.5rem",
  topbarHeight: "5rem",
  contentMax: "84rem",
  contentWide: "96rem",
  reading: "44rem"
};

export const nexusTokens = {
  colorModes,
  spacing,
  radius,
  shadows,
  typography,
  layout
};

export function resolveThemeTokens(mode = "light") {
  return {
    colors: colorModes[mode] ?? colorModes.light,
    spacing,
    radius,
    shadows,
    typography,
    layout
  };
}
