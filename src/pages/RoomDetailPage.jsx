import { DevicesGrid } from "../components/rooms/DevicesGrid.jsx";
import { RoomTabs } from "../components/rooms/RoomTabs.jsx";
import { useActiveRoom, useRoomDevices, useRoomSummaries } from "../state/hooks/useSelectors.js";

export function RoomDetailPage() {
  const activeRoom = useActiveRoom();
  const activeDevices = useRoomDevices();
  const roomSummary = useRoomSummaries().find((room) => room.id === activeRoom?.id);

  return (
    <section aria-labelledby="room-detail-page-title" className="room-detail-stack">
      <header className="card room-detail-hero">
        <div className="room-detail-hero__copy">
          <p className="overview-section-label">Room detail</p>
          <h2 id="room-detail-page-title">{activeRoom?.name ?? "Room detail"}</h2>
          <p className="text-muted">
            Navega por habitaciones y revisa los dispositivos del cuarto activo con controles
            basicos, tarjetas limpias y espacio listo para vistas mas avanzadas.
          </p>
        </div>

        <div className="room-detail-hero__stats" aria-label="Resumen del cuarto">
          <article>
            <span className="overview-meta-label">Devices</span>
            <strong>{roomSummary?.deviceCount ?? activeDevices.length}</strong>
          </article>
          <article>
            <span className="overview-meta-label">Online</span>
            <strong>{roomSummary?.onlineCount ?? 0}</strong>
          </article>
          <article>
            <span className="overview-meta-label">Active lights</span>
            <strong>{roomSummary?.activeLights ?? 0}</strong>
          </article>
        </div>
      </header>

      <RoomTabs />
      <DevicesGrid />
    </section>
  );
}
