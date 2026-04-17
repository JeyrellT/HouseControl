import { formatRelativeMinutes } from "../../utils/formatters.js";

export function DoorCard({ device, titleId }) {
  const isLocked = Boolean(device.state?.locked);

  return (
    <article className="device-card" role="listitem" aria-labelledby={titleId}>
      <div className="device-card__header">
        <div>
          <p className="overview-section-label">Door</p>
          <h4 id={titleId}>{device.name}</h4>
        </div>
        <span className="overview-status-pill" data-status={device.online ? "online" : "offline"}>
          {device.online ? "online" : "offline"}
        </span>
      </div>

      <div className="device-card__status-row">
        <strong>{isLocked ? "Locked" : "Unlocked"}</strong>
        <span className="overview-priority-pill" data-priority={isLocked ? "low" : "medium"}>
          {isLocked ? "Secure" : "Attention"}
        </span>
      </div>

      <p className="text-muted">
        Estado actual del acceso. Esta vista deja espacio para futuras acciones remotas y auditoria.
      </p>

      <dl className="device-card__meta">
        <div>
          <dt className="overview-meta-label">Battery</dt>
          <dd>{device.state?.battery ?? "--"}%</dd>
        </div>
        <div>
          <dt className="overview-meta-label">Last seen</dt>
          <dd>{formatRelativeMinutes(device.lastSeenAt)}</dd>
        </div>
      </dl>
    </article>
  );
}
