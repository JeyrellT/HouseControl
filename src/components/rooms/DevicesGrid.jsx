import { DeviceCard } from "../devices/DeviceCard.jsx";
import { EmptyState } from "../feedback/EmptyState.jsx";
import { useActiveRoom, useRoomDevices } from "../../state/hooks/useSelectors.js";

export function DevicesGrid() {
  const activeRoom = useActiveRoom();
  const devices = useRoomDevices();

  return (
    <section
      className="card room-devices-card"
      id={`room-panel-${activeRoom?.id ?? "current"}`}
      role="tabpanel"
      aria-labelledby={activeRoom ? `room-tab-${activeRoom.id}` : undefined}
      aria-describedby="room-devices-title"
    >
      <div className="room-devices-card__header">
        <div>
          <p className="overview-section-label">Devices</p>
          <h3 id="room-devices-title">
            {activeRoom?.name ? `Devices in ${activeRoom.name}` : "Room devices"}
          </h3>
        </div>
        <span className="overview-counter">{devices.length} visibles</span>
      </div>

      {devices.length === 0 ? (
        <EmptyState
          title="Este cuarto aun no tiene dispositivos."
          description="Nexus mostrara aqui los controles basicos y el estado operativo apenas haya hardware asignado."
          hint="La estructura ya esta lista para sumar nuevos tipos de dispositivo sin cambiar esta vista."
        />
      ) : (
        <div className="devices-grid" role="list" aria-label="Lista de dispositivos del cuarto activo">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}
    </section>
  );
}
