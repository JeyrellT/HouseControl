function formatLastSync(lastSyncedAt) {
  if (!lastSyncedAt) {
    return "Sincronizando demo...";
  }

  return new Intl.DateTimeFormat("es-GT", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(lastSyncedAt));
}

export function TopBar({ density, sessionSummary, onDensityToggle }) {
  return (
    <header className="top-bar">
      <div>
        <p className="top-bar__eyebrow">Centro de control Nexus</p>
        <h1 className="top-bar__title">Arquitectura frontend lista para expansión enterprise</h1>
      </div>
      <div className="top-bar__actions">
        <div className="top-bar__status" aria-live="polite">
          <span>{sessionSummary.mockMode ? "Modo mock" : "Modo live"}</span>
          <strong>{formatLastSync(sessionSummary.lastSyncedAt)}</strong>
        </div>
        <button
          type="button"
          className="top-bar__density"
          onClick={onDensityToggle}
          aria-label={`Cambiar densidad visual. Actual: ${density}`}
        >
          Densidad {density === "comfortable" ? "cómoda" : "compacta"}
        </button>
      </div>
    </header>
  );
}
