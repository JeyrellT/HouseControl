import { FeedbackState } from "./EmptyState.jsx";

export function ErrorState({
  title = "Algo salio mal.",
  description = "No pudimos construir esta vista con el estado disponible.",
  hint = "Revisa el mock state o intenta la accion nuevamente."
}) {
  return (
    <FeedbackState
      tone="danger"
      badge="Error"
      title={title}
      description={description}
      hint={hint}
      role="alert"
      live="assertive"
    />
  );
}
