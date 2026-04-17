import { useNexusDispatch } from "../../state/nexusContext.jsx";

function formatThemeLabel(theme) {
  return theme === "dark" ? "Dark" : "Light";
}

function formatModeLabel(mode) {
  return mode === "admin" ? "Admin" : "Homeowner";
}

export function TopBar({ title, subtitle, mode, theme, onModeToggle }) {
  const { actions } = useNexusDispatch();

  return (
    <header className="topbar" aria-labelledby="topbar-title">
      <div>
        <p className="text-soft">Nexus Control Layer</p>
        <h1 id="topbar-title">{title}</h1>
        <p className="text-muted" id="topbar-subtitle">
          {subtitle}
        </p>
      </div>

      <div
        style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
        aria-label="Controles globales"
      >
        <button
          type="button"
          className="tab"
          aria-pressed={mode === "admin"}
          aria-label={`Cambiar modo de vista. Actual: ${formatModeLabel(mode)}`}
          onClick={onModeToggle}
        >
          {formatModeLabel(mode)}
        </button>
        <button
          type="button"
          className="tab"
          aria-label={`Cambiar tema. Actual: ${formatThemeLabel(theme)}`}
          onClick={actions.toggleTheme}
        >
          {formatThemeLabel(theme)}
        </button>
      </div>
    </header>
  );
}
