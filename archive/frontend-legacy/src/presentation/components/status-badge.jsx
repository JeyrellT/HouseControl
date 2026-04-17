const toneByStatus = {
  healthy: "positive",
  ready: "positive",
  success: "positive",
  watch: "caution",
  standby: "neutral",
  planned: "neutral",
  open: "accent",
  info: "accent",
  critical: "critical",
  high: "accent",
  medium: "neutral",
  low: "neutral"
};

export function StatusBadge({ label, status }) {
  const tone = toneByStatus[status] ?? "neutral";

  return (
    <span className={`status-badge status-badge--${tone}`} aria-label={`Estado ${label}`}>
      {label}
    </span>
  );
}
