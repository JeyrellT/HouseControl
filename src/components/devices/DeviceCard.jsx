import { CameraCard } from "./CameraCard.jsx";
import { DoorCard } from "./DoorCard.jsx";
import { LightCard } from "./LightCard.jsx";
import { DEVICE_TYPES } from "../../utils/constants.js";
import { formatRelativeMinutes } from "../../utils/formatters.js";

function formatTypeLabel(type) {
  if (!type) {
    return "device";
  }

  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatStatePreview(state) {
  if (!state || typeof state !== "object") {
    return "No state available.";
  }

  const visibleEntries = Object.entries(state).slice(0, 2);

  if (visibleEntries.length === 0) {
    return "No state available.";
  }

  return visibleEntries.map(([key, value]) => `${key}: ${String(value)}`).join(" | ");
}

export function DeviceCard({ device }) {
  const titleId = `${device.id}-title`;

  switch (device.type) {
    case DEVICE_TYPES.LIGHT:
      return <LightCard device={device} titleId={titleId} />;
    case DEVICE_TYPES.DOOR:
      return <DoorCard device={device} titleId={titleId} />;
    case DEVICE_TYPES.CAMERA:
      return <CameraCard device={device} titleId={titleId} />;
    default:
      return (
        <article className="device-card device-card--generic" role="listitem" aria-labelledby={titleId}>
          <div className="device-card__header">
            <div>
              <p className="overview-section-label">{formatTypeLabel(device.type)}</p>
              <h4 id={titleId}>{device.name}</h4>
            </div>
            <span
              className="overview-status-pill"
              data-status={device.online ? "online" : "offline"}
            >
              {device.online ? "online" : "offline"}
            </span>
          </div>

          <p className="text-muted">{formatStatePreview(device.state)}</p>

          <dl className="device-card__meta">
            <div>
              <dt className="overview-meta-label">Subtype</dt>
              <dd>{device.subtype ?? "n/a"}</dd>
            </div>
            <div>
              <dt className="overview-meta-label">Last seen</dt>
              <dd>{formatRelativeMinutes(device.lastSeenAt)}</dd>
            </div>
          </dl>
        </article>
      );
  }
}
