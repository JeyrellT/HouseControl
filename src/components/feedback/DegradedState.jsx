import { FeedbackState } from "./EmptyState.jsx";

export function DegradedState({
  title = "Hay elementos degradados.",
  description = "Nexus detecto capacidad reducida en parte del sistema.",
  hint = "La interfaz sigue operativa, pero conviene revisar los elementos marcados."
}) {
  return (
    <FeedbackState
      tone="warning"
      badge="Degraded"
      title={title}
      description={description}
      hint={hint}
      role="status"
      live="polite"
    />
  );
}
