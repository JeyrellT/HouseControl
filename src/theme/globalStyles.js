import { useEffect } from "react";
import { nexusTokens } from "./tokens.js";

const STYLE_ELEMENT_ID = "nexus-global-styles";
const THEME_CLASS_LIGHT = "theme-light";
const THEME_CLASS_DARK = "theme-dark";

function flattenTokens(source, path = []) {
  return Object.entries(source).reduce((accumulator, [key, value]) => {
    const nextPath = [...path, key];

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return {
        ...accumulator,
        ...flattenTokens(value, nextPath)
      };
    }

    accumulator[nextPath.join("-")] = String(value);
    return accumulator;
  }, {});
}

function toCssVariables(tokenGroup) {
  return Object.entries(flattenTokens(tokenGroup))
    .map(([key, value]) => `  --nexus-${key}: ${value};`)
    .join("\n");
}

function getThemeVariablesCss() {
  const sharedVariables = toCssVariables({
    spacing: nexusTokens.spacing,
    radius: nexusTokens.radius,
    shadows: nexusTokens.shadows,
    typography: nexusTokens.typography,
    layout: nexusTokens.layout
  });

  const lightVariables = toCssVariables({
    colors: nexusTokens.colorModes.light
  });

  const darkVariables = toCssVariables({
    colors: nexusTokens.colorModes.dark
  });

  return `
:root {
${sharedVariables}
${lightVariables}
}

.${THEME_CLASS_LIGHT} {
${lightVariables}
}

.${THEME_CLASS_DARK} {
${darkVariables}
}
`;
}

export function getGlobalStylesCss() {
  return `
${getThemeVariablesCss()}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html,
body,
#root {
  min-height: 100%;
}

body {
  margin: 0;
  font-family: var(--nexus-typography-fontFamily-sans);
  font-size: var(--nexus-typography-fontSize-md);
  line-height: var(--nexus-typography-lineHeight-normal);
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 24%),
    linear-gradient(180deg, var(--nexus-colors-base-background) 0%, var(--nexus-colors-base-backgroundSubtle) 100%);
  color: var(--nexus-colors-base-text);
}

img,
svg {
  display: block;
  max-width: 100%;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
  color: inherit;
}

button:disabled,
input:disabled,
select:disabled,
textarea:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

a {
  color: inherit;
  text-decoration: none;
}

ul,
ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

h1,
h2,
h3,
h4,
h5,
h6,
p {
  margin: 0;
}

:focus-visible {
  outline: 2px solid var(--nexus-colors-base-accent);
  outline-offset: 2px;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: var(--nexus-layout-sidebarWidth) minmax(0, 1fr);
  background: transparent;
}

.app-shell__content {
  min-width: 0;
  padding: var(--nexus-spacing-6);
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--nexus-spacing-6);
  padding: var(--nexus-spacing-6);
  border-right: 1px solid var(--nexus-colors-base-border);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
}

.theme-dark .sidebar {
  background: rgba(17, 27, 42, 0.8);
}

.topbar {
  min-height: var(--nexus-layout-topbarHeight);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--nexus-spacing-4);
  margin-bottom: var(--nexus-spacing-6);
  padding: var(--nexus-spacing-5) var(--nexus-spacing-6);
  border: 1px solid var(--nexus-colors-base-border);
  border-radius: var(--nexus-radius-xl);
  background: rgba(255, 255, 255, 0.68);
  box-shadow: var(--nexus-shadows-sm);
  backdrop-filter: blur(18px);
}

.theme-dark .topbar {
  background: rgba(17, 27, 42, 0.8);
}

.page-container {
  width: min(100%, var(--nexus-layout-contentMax));
  display: grid;
  gap: var(--nexus-spacing-6);
}

.card {
  display: grid;
  gap: var(--nexus-spacing-4);
  padding: var(--nexus-spacing-5);
  border: 1px solid var(--nexus-colors-base-border);
  border-radius: var(--nexus-radius-lg);
  background: var(--nexus-colors-base-backgroundElevated);
  box-shadow: var(--nexus-shadows-sm);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--nexus-spacing-2);
  padding: 0.375rem 0.75rem;
  border-radius: var(--nexus-radius-pill);
  background: var(--nexus-colors-base-accentSoft);
  color: var(--nexus-colors-base-accent);
  font-size: var(--nexus-typography-fontSize-xs);
  font-weight: var(--nexus-typography-fontWeight-semibold);
}

.stat-card {
  display: grid;
  gap: var(--nexus-spacing-3);
  padding: var(--nexus-spacing-5);
  border: 1px solid var(--nexus-colors-base-border);
  border-radius: var(--nexus-radius-lg);
  background: linear-gradient(
    180deg,
    var(--nexus-colors-base-backgroundElevated) 0%,
    var(--nexus-colors-base-backgroundSubtle) 100%
  );
  box-shadow: var(--nexus-shadows-sm);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--nexus-spacing-5);
}

.dashboard-grid > * {
  grid-column: span 12;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--nexus-spacing-4);
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--nexus-spacing-3);
  padding: 0.875rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--nexus-radius-md);
  background: transparent;
  color: var(--nexus-colors-base-textMuted);
  font-weight: var(--nexus-typography-fontWeight-medium);
  text-align: left;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}

.nav-item:hover,
.nav-item[aria-current="page"] {
  border-color: var(--nexus-colors-base-border);
  background: var(--nexus-colors-base-backgroundElevated);
  color: var(--nexus-colors-base-text);
}

.nav-item:focus-visible,
.tab:focus-visible,
.room-tab:focus-visible,
.overview-action-card__main:focus-visible,
.overview-ghost-button:focus-visible,
.overview-scene-card__action:focus-visible {
  box-shadow: 0 0 0 3px var(--nexus-colors-base-accentSoft);
}

.tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1rem;
  border: 1px solid var(--nexus-colors-base-border);
  border-radius: var(--nexus-radius-pill);
  background: transparent;
  color: var(--nexus-colors-base-textMuted);
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}

.tab[aria-selected="true"],
.tab:hover {
  border-color: var(--nexus-colors-base-accentSoft);
  background: var(--nexus-colors-base-accentSoft);
  color: var(--nexus-colors-base-accent);
}

.text-muted {
  color: var(--nexus-colors-base-textMuted);
}

.text-soft {
  color: var(--nexus-colors-base-textSoft);
}

.surface-subtle {
  background: var(--nexus-colors-base-backgroundSubtle);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.overview-stack,
.overview-grid__primary,
.overview-grid__secondary,
.overview-panel,
.overview-action-list,
.overview-scene-list,
.overview-platform-list,
.overview-timeline,
.neuro-card,
.neuro-banner {
  display: grid;
  gap: var(--nexus-spacing-5);
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(18rem, 1fr);
  gap: var(--nexus-spacing-5);
  align-items: start;
}

.neuro-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(18rem, 0.9fr);
  gap: var(--nexus-spacing-5);
}

.overview-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(18rem, 1fr);
  gap: var(--nexus-spacing-5);
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 36%),
    linear-gradient(
      135deg,
      var(--nexus-colors-base-backgroundElevated) 0%,
      var(--nexus-colors-base-backgroundSubtle) 100%
    );
}

.overview-hero__content,
.overview-hero__spotlight {
  display: grid;
  gap: var(--nexus-spacing-4);
}

.overview-hero__eyebrow,
.overview-panel__header,
.overview-action-card__topline,
.overview-action-card__badges,
.overview-inline-stats,
.overview-timeline__header,
.overview-platform-card__header,
.neuro-card__header,
.neuro-banner__header,
.neuro-inline-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--nexus-spacing-3);
  flex-wrap: wrap;
}

.overview-section-label,
.overview-meta-label,
.overview-hero__timestamp {
  color: var(--nexus-colors-base-textSoft);
  font-size: var(--nexus-typography-fontSize-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.overview-hero__copy {
  display: grid;
  gap: var(--nexus-spacing-3);
}

.overview-hero__title {
  font-size: clamp(1.8rem, 2vw + 1rem, 2.7rem);
  line-height: var(--nexus-typography-lineHeight-tight);
  letter-spacing: -0.04em;
}

.overview-hero__description {
  max-width: 42rem;
}

.overview-hero__chips,
.overview-hero__meta,
.overview-platform-card__metrics,
.overview-insight-grid {
  display: grid;
  gap: var(--nexus-spacing-3);
}

.overview-hero__chips {
  grid-template-columns: repeat(auto-fit, minmax(10rem, max-content));
}

.overview-chip,
.overview-counter,
.overview-priority-pill,
.overview-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--nexus-spacing-2);
  padding: 0.45rem 0.8rem;
  border-radius: var(--nexus-radius-pill);
  font-size: var(--nexus-typography-fontSize-xs);
  font-weight: var(--nexus-typography-fontWeight-semibold);
}

.overview-chip,
.overview-counter {
  background: var(--nexus-colors-base-backgroundSubtle);
  color: var(--nexus-colors-base-textMuted);
  border: 1px solid var(--nexus-colors-base-border);
}

.overview-hero__spotlight {
  padding: var(--nexus-spacing-5);
  border: 1px solid var(--nexus-colors-base-border);
  border-radius: var(--nexus-radius-lg);
  background: rgba(255, 255, 255, 0.48);
}

.theme-dark .overview-hero__spotlight {
  background: rgba(9, 17, 28, 0.36);
}

.overview-hero__spotlight-title,
.overview-insight-feature__title,
.overview-scene-card__title,
.overview-action-card__title {
  font-size: var(--nexus-typography-fontSize-lg);
  line-height: 1.35;
}

.overview-hero__meta {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.overview-hero__meta div,
.overview-platform-card__metrics div {
  display: grid;
  gap: var(--nexus-spacing-2);
}

.overview-kpi-card {
  min-height: 10rem;
}

.overview-kpi-card__value {
  font-size: clamp(2rem, 4vw, 2.5rem);
  line-height: 1;
  letter-spacing: -0.04em;
}

.overview-kpi-card[data-tone="warning"] {
  border-color: rgba(180, 83, 9, 0.24);
}

.overview-kpi-card[data-tone="success"] {
  border-color: rgba(21, 128, 61, 0.24);
}

.overview-kpi-card[data-tone="info"] {
  border-color: rgba(15, 95, 168, 0.24);
}

.overview-panel h3 {
  font-size: 1.2rem;
}

.overview-empty {
  display: grid;
  gap: var(--nexus-spacing-2);
  padding: var(--nexus-spacing-5);
  border: 1px dashed var(--nexus-colors-base-borderStrong);
  border-radius: var(--nexus-radius-lg);
  background: var(--nexus-colors-base-backgroundSubtle);
}

.feedback-state {
  display: grid;
  gap: var(--nexus-spacing-2);
  padding: var(--nexus-spacing-5);
  border: 1px dashed var(--nexus-colors-base-borderStrong);
  border-radius: var(--nexus-radius-lg);
  background: var(--nexus-colors-base-backgroundSubtle);
}

.feedback-state__hint {
  color: var(--nexus-colors-base-textSoft);
  font-size: var(--nexus-typography-fontSize-sm);
}

.feedback-state--info {
  border-color: rgba(15, 95, 168, 0.28);
}

.feedback-state--warning {
  border-color: rgba(180, 83, 9, 0.28);
}

.feedback-state--danger {
  border-color: rgba(180, 35, 24, 0.28);
}

.overview-action-card,
.overview-scene-card,
.overview-platform-card,
.overview-insight-card {
  border: 1px solid var(--nexus-colors-base-border);
  border-radius: var(--nexus-radius-lg);
  background: linear-gradient(
    180deg,
    var(--nexus-colors-base-backgroundElevated) 0%,
    var(--nexus-colors-base-backgroundSubtle) 100%
  );
}

.overview-action-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--nexus-spacing-4);
  padding: var(--nexus-spacing-4);
  align-items: start;
}

.overview-action-card[data-selected="true"] {
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.12);
}

.overview-action-card__main,
.overview-ghost-button {
  border: 0;
  background: transparent;
}

.overview-action-card__main {
  display: grid;
  gap: var(--nexus-spacing-3);
  padding: 0;
  text-align: left;
}

.overview-action-card__main[aria-pressed="true"] .overview-action-card__title {
  color: var(--nexus-colors-base-accent);
}

.overview-ghost-button {
  padding: 0.55rem 0.8rem;
  border-radius: var(--nexus-radius-pill);
  color: var(--nexus-colors-base-textMuted);
}

.overview-ghost-button:hover {
  background: var(--nexus-colors-base-backgroundSubtle);
  color: var(--nexus-colors-base-text);
}

.overview-priority-pill[data-priority="high"] {
  background: var(--nexus-colors-semantic-dangerSoft);
  color: var(--nexus-colors-semantic-danger);
}

.overview-priority-pill[data-priority="medium"] {
  background: var(--nexus-colors-semantic-warningSoft);
  color: var(--nexus-colors-semantic-warning);
}

.overview-priority-pill[data-priority="low"] {
  background: var(--nexus-colors-semantic-infoSoft);
  color: var(--nexus-colors-semantic-info);
}

.overview-scene-card,
.overview-platform-card {
  display: grid;
  gap: var(--nexus-spacing-4);
  padding: var(--nexus-spacing-4);
}

.overview-scene-card {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}

.overview-scene-card__action {
  white-space: nowrap;
}

.overview-inline-stats {
  color: var(--nexus-colors-base-textMuted);
  font-size: var(--nexus-typography-fontSize-sm);
}

.overview-platform-card__metrics {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.overview-status-pill[data-status="online"] {
  background: var(--nexus-colors-semantic-successSoft);
  color: var(--nexus-colors-semantic-success);
}

.overview-status-pill[data-status="degraded"] {
  background: var(--nexus-colors-semantic-warningSoft);
  color: var(--nexus-colors-semantic-warning);
}

.overview-status-pill[data-status="offline"] {
  background: var(--nexus-colors-semantic-dangerSoft);
  color: var(--nexus-colors-semantic-danger);
}

.overview-insight-feature {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(14rem, 0.9fr);
  gap: var(--nexus-spacing-4);
  padding: var(--nexus-spacing-4);
  border-radius: var(--nexus-radius-lg);
  background: var(--nexus-colors-base-backgroundSubtle);
}

.overview-insight-feature__copy,
.overview-insight-feature__action {
  display: grid;
  gap: var(--nexus-spacing-3);
}

.overview-insight-feature__action {
  padding: var(--nexus-spacing-4);
  border: 1px solid var(--nexus-colors-base-border);
  border-radius: var(--nexus-radius-md);
  background: var(--nexus-colors-base-backgroundElevated);
}

.overview-insight-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.overview-insight-card {
  display: grid;
  gap: var(--nexus-spacing-2);
  padding: var(--nexus-spacing-4);
}

.overview-timeline {
  position: relative;
}

.overview-timeline__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--nexus-spacing-4);
  align-items: start;
}

.overview-timeline__marker {
  width: 0.75rem;
  height: 0.75rem;
  margin-top: 0.35rem;
  border-radius: 50%;
  background: var(--nexus-colors-base-accent);
  box-shadow: 0 0 0 6px var(--nexus-colors-base-accentSoft);
}

.overview-timeline__content {
  display: grid;
  gap: var(--nexus-spacing-2);
  padding-bottom: var(--nexus-spacing-5);
  border-bottom: 1px solid var(--nexus-colors-base-border);
}

.overview-timeline__item:last-child .overview-timeline__content {
  border-bottom: 0;
  padding-bottom: 0;
}

.neuro-banner__signals,
.neuro-load-grid {
  display: grid;
  gap: var(--nexus-spacing-3);
}

.neuro-banner__signals {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.neuro-load-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.neuro-load-metric {
  display: grid;
  gap: var(--nexus-spacing-2);
  padding: var(--nexus-spacing-4);
  border-radius: var(--nexus-radius-lg);
  border: 1px solid var(--nexus-colors-base-border);
  background: var(--nexus-colors-base-backgroundSubtle);
}

.neuro-load-metric strong {
  font-size: 1.2rem;
}

.room-detail-stack,
.room-detail-hero__copy,
.room-tabs-card,
.room-devices-card,
.room-devices-card__header,
.room-tabs-card__header,
.device-card,
.device-light-card__status,
.device-light-card__controls,
.device-slider {
  display: grid;
  gap: var(--nexus-spacing-4);
}

.room-detail-hero {
  grid-template-columns: minmax(0, 1.6fr) minmax(15rem, 1fr);
  align-items: center;
}

.room-detail-hero__stats,
.device-card__header,
.device-card__status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--nexus-spacing-3);
  flex-wrap: wrap;
}

.room-detail-hero__stats {
  justify-content: stretch;
}

.room-detail-hero__stats article {
  flex: 1 1 0;
  min-width: 7rem;
  display: grid;
  gap: var(--nexus-spacing-2);
  padding: var(--nexus-spacing-4);
  border: 1px solid var(--nexus-colors-base-border);
  border-radius: var(--nexus-radius-lg);
  background: var(--nexus-colors-base-backgroundSubtle);
}

.room-detail-hero__stats strong {
  font-size: 1.45rem;
  letter-spacing: -0.03em;
}

.room-tabs {
  display: flex;
  gap: var(--nexus-spacing-3);
  flex-wrap: wrap;
}

.room-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.9rem;
  padding: 0.8rem 1.05rem;
  border: 1px solid var(--nexus-colors-base-border);
  border-radius: var(--nexus-radius-pill);
  background: var(--nexus-colors-base-backgroundSubtle);
  color: var(--nexus-colors-base-textMuted);
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}

.room-tab[aria-selected="true"],
.room-tab:hover {
  border-color: var(--nexus-colors-base-accentSoft);
  background: var(--nexus-colors-base-accentSoft);
  color: var(--nexus-colors-base-accent);
}

.room-tab__label {
  font-weight: var(--nexus-typography-fontWeight-medium);
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--nexus-spacing-4);
}

.device-card {
  padding: var(--nexus-spacing-4);
  border: 1px solid var(--nexus-colors-base-border);
  border-radius: var(--nexus-radius-lg);
  background: linear-gradient(
    180deg,
    var(--nexus-colors-base-backgroundElevated) 0%,
    var(--nexus-colors-base-backgroundSubtle) 100%
  );
}

.device-card h4 {
  font-size: 1.05rem;
}

.device-card__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--nexus-spacing-3);
}

.device-card__meta div {
  display: grid;
  gap: var(--nexus-spacing-2);
  padding: var(--nexus-spacing-3);
  border-radius: var(--nexus-radius-md);
  background: var(--nexus-colors-base-backgroundElevated);
}

.device-slider input[type="range"] {
  width: 100%;
  accent-color: var(--nexus-colors-base-accent);
}

.device-slider span:last-child {
  color: var(--nexus-colors-base-textMuted);
  font-size: var(--nexus-typography-fontSize-sm);
}

.empty-state-card {
  align-items: start;
}

@media (max-width: 1024px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: 0;
    border-bottom: 1px solid var(--nexus-colors-base-border);
  }

  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview-grid,
  .overview-hero,
  .overview-insight-feature,
  .neuro-grid {
    grid-template-columns: 1fr;
  }

  .overview-hero__meta,
  .overview-platform-card__metrics,
  .overview-insight-grid,
  .neuro-banner__signals,
  .neuro-load-grid {
    grid-template-columns: 1fr;
  }

  .room-detail-hero,
  .devices-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .app-shell__content,
  .sidebar {
    padding: var(--nexus-spacing-4);
  }

  .topbar,
  .card,
  .stat-card {
    padding: var(--nexus-spacing-4);
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .overview-action-card,
  .overview-scene-card,
  .overview-timeline__item {
    grid-template-columns: 1fr;
  }

  .overview-action-card,
  .overview-scene-card,
  .overview-hero__spotlight {
    padding: var(--nexus-spacing-4);
  }

  .device-card__meta {
    grid-template-columns: 1fr;
  }
}
`;
}

export function ensureGlobalStyles() {
  if (typeof document === "undefined") {
    return;
  }

  let styleElement = document.getElementById(STYLE_ELEMENT_ID);

  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = STYLE_ELEMENT_ID;
    document.head.appendChild(styleElement);
  }

  styleElement.textContent = getGlobalStylesCss();
}

export function setDocumentTheme(theme = "light") {
  if (typeof document === "undefined") {
    return;
  }

  document.body.classList.remove(THEME_CLASS_LIGHT, THEME_CLASS_DARK);
  document.body.classList.add(theme === "dark" ? THEME_CLASS_DARK : THEME_CLASS_LIGHT);
}

export function GlobalStyles({ theme = "light" }) {
  useEffect(() => {
    ensureGlobalStyles();
    setDocumentTheme(theme);
  }, [theme]);

  return null;
}
