import { formatRelativeMinutes } from "../../utils/formatters.js";

export function CameraCard({ device, titleId }) {
  const isRecording = Boolean(device.state?.recording);
  const motionDetected = Boolean(device.state?.motionDetected);
  const privacyMode = Boolean(device.state?.privacyMode);

  return (
    <article className="device-card" role="listitem" aria-labelledby={titleId}>
      <div className="device-card__header">
        <div>
          <p className="overview-section-label">Camera</p>
          <h4 id={titleId}>{device.name}</h4>
        </div>
        <span className="overview-status-pill" data-status={device.online ? "online" : "offline"}>
          {device.online ? "online" : "offline"}
        </span>
      </div>

      <div className="device-card__status-row">
        <strong>{isRecording ? "Recording" : "Standby"}</strong>
        <span className="overview-chip">{motionDetected ? "Motion detected" : "No motion"}</span>
      </div>

      <p className="text-muted">
        {privacyMode
          ? "Privacy mode activo. La camara mantiene cobertura limitada."
          : "Estado basico de monitoreo listo para futuras vistas de streaming y eventos."}
      </p>

      <dl className="device-card__meta">
        <div>
          <dt className="overview-meta-label">Privacy</dt>
          <dd>{privacyMode ? "On" : "Off"}</dd>
        </div>
        <div>
          <dt className="overview-meta-label">Last seen</dt>
          <dd>{formatRelativeMinutes(device.lastSeenAt)}</dd>
        </div>
      </dl>
    </article>
  );
}
