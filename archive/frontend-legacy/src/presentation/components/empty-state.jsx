export function EmptyState({ title, description }) {
  return (
    <div className="empty-state" role="status">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
