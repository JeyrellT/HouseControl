import { EmptyState } from "../feedback/EmptyState.jsx";

export function QuickScenesPanel({ scenes, onApplyScene }) {
  return (
    <section className="card overview-panel" aria-labelledby="quick-scenes-title">
      <div className="overview-panel__header">
        <div>
          <p className="overview-section-label">Escenas</p>
          <h3 id="quick-scenes-title">Quick scenes</h3>
        </div>
        <span className="overview-counter">{scenes.length} disponibles</span>
      </div>

      {scenes.length === 0 ? (
        <EmptyState
          title="No hay quick scenes disponibles."
          description="Este contexto todavia no expone escenas listas para aplicar."
          hint="La estructura ya esta lista para crecer con escenas sugeridas o favoritas."
        />
      ) : (
        <div className="overview-scene-list" role="list" aria-label="Escenas rapidas disponibles">
          {scenes.map((scene) => (
            <article key={scene.id} className="overview-scene-card" role="listitem">
              <div>
                <p className="overview-section-label">{scene.scopeLabel}</p>
                <strong className="overview-scene-card__title">{scene.name}</strong>
                <p className="text-muted">{scene.description}</p>
              </div>

              <button
                type="button"
                className="tab overview-scene-card__action"
                onClick={() => onApplyScene(scene.id)}
                aria-label={`Aplicar escena ${scene.name}`}
              >
                Apply scene
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
