import { NavRail } from "../components/nav-rail.jsx";
import { TopBar } from "../components/top-bar.jsx";

export function AppShell({
  children,
  currentRoute,
  density,
  railCollapsed,
  sessionSummary,
  onDensityToggle,
  onNavigate,
  onRailToggle
}) {
  return (
    <div className="app-shell" data-density={density}>
      <NavRail
        currentRoute={currentRoute}
        isCollapsed={railCollapsed}
        onNavigate={onNavigate}
        onToggle={onRailToggle}
      />
      <div className="app-shell__content">
        <TopBar density={density} sessionSummary={sessionSummary} onDensityToggle={onDensityToggle} />
        <main className="app-shell__main" aria-live="polite">
          {children}
        </main>
      </div>
    </div>
  );
}
