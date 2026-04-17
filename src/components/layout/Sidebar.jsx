import { useNexusDispatch } from "../../state/nexusContext.jsx";

export function Sidebar({ items, activeItem }) {
  const { actions } = useNexusDispatch();

  return (
    <aside className="sidebar" aria-labelledby="sidebar-title">
      <div className="card" aria-labelledby="sidebar-title">
        <strong id="sidebar-title">Nexus</strong>
        <p className="text-soft">Control shell listo para crecer sobre estado global.</p>
      </div>

      <nav aria-label="Navegacion principal">
        <ul>
          {items.map((item) => {
            const isActive = item.id === activeItem;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="nav-item"
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`Ir a ${item.label}`}
                  onClick={() => actions.setActivePage(item.id)}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
