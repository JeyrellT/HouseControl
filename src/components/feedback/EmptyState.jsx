function FeedbackState({
  tone = "neutral",
  badge = "State",
  title,
  description,
  hint,
  role = "status",
  live = "polite"
}) {
  return (
    <div
      className={`feedback-state feedback-state--${tone}`}
      role={role}
      aria-live={live}
    >
      <span className="badge">{badge}</span>
      <strong>{title}</strong>
      <p className="text-muted">{description}</p>
      {hint ? <p className="feedback-state__hint">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({ title, description, hint }) {
  return (
    <FeedbackState
      tone="neutral"
      badge="Empty"
      title={title}
      description={description}
      hint={hint}
    />
  );
}

export { FeedbackState };
