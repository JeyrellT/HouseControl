import { FeedbackState } from "./EmptyState.jsx";

export function LoadingState({
  title = "Cargando contenido.",
  description = "Nexus esta preparando esta vista.",
  hint = "El estado de carga es local y reutilizable para futuras integraciones."
}) {
  return (
    <FeedbackState
      tone="info"
      badge="Loading"
      title={title}
      description={description}
      hint={hint}
      role="status"
      live="polite"
    />
  );
}
