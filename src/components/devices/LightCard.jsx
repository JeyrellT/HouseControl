import { useNexusDispatch } from "../../state/nexusContext.jsx";

export function LightCard({ device, titleId }) {
  const { actions } = useNexusDispatch();
  const brightness = device.state?.brightness ?? 0;
  const isPowered = Boolean(device.state?.power);

  return (
    <article className="device-card" role="listitem" aria-labelledby={titleId}>
      <div className="device-card__header">
        <div>
          <p className="overview-section-label">Light</p>
          <h4 id={titleId}>{device.name}</h4>
        </div>
        <span className="overview-status-pill" data-status={device.online ? "online" : "offline"}>
          {device.online ? "online" : "offline"}
        </span>
      </div>

      <div className="device-light-card__status">
        <strong>{isPowered ? "Power on" : "Power off"}</strong>
        <p className="text-muted">
          Brillo actual {brightness}%. Ajusta el nivel o apaga la luz desde esta tarjeta.
        </p>
      </div>

      <div className="device-light-card__controls">
        <button
          type="button"
          className="tab"
          aria-pressed={isPowered}
          onClick={() => actions.toggleDevicePower(device.id)}
          disabled={!device.online}
          aria-label={`${isPowered ? "Apagar" : "Encender"} ${device.name}`}
        >
          {isPowered ? "Turn off" : "Turn on"}
        </button>

        <label className="device-slider">
          <span className="overview-meta-label">Brightness</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={brightness}
            onChange={(event) => actions.setDeviceBrightness(device.id, Number(event.target.value))}
            disabled={!device.online}
            aria-label={`Brightness for ${device.name}`}
          />
          <span>{brightness}%</span>
        </label>
      </div>
    </article>
  );
}
