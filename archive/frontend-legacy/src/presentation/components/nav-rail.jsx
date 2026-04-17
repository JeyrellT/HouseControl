import { ROUTES } from "../../state/route.js";

export function NavRail({ currentRoute, isCollapsed, onNavigate, onToggle }) {
  return (
    <aside className={`nav-rail ${isCollapsed ? "is-collapsed" : ""}`} aria-label="Navegación principal">
      <div className="nav-rail__brand">
        <span className="nav-rail__glyph">N</span>
        {!isCollapsed ? (
          <div>
            <strong>Nexus</strong>
            <p>Control Center</p>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className="nav-rail__toggle"
        aria-label={isCollapsed ? "Expandir navegación" : "Contraer navegación"}
        onClick={onToggle}
      >
        {isCollapsed ? ">>" : "<<"}
      </button>

      <nav className="nav-rail__nav">
        {ROUTES.map((route) => (
          <button
            key={route.id}
            type="button"
            className={`nav-rail__item ${route.id === currentRoute ? "is-active" : ""}`}
            aria-current={route.id === currentRoute ? "page" : undefined}
            onClick={() => onNavigate(route.id)}
          >
            <span className="nav-rail__item-dot" />
            {!isCollapsed ? route.label : route.label.slice(0, 1)}
          </button>
        ))}
      </nav>
    </aside>
  );
}
