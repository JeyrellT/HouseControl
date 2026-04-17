import { useNexusDispatch } from "../../state/nexusContext.jsx";
import { useRoomsList, useUiSelector } from "../../state/hooks/useSelectors.js";

export function RoomTabs() {
  const { actions } = useNexusDispatch();
  const rooms = useRoomsList();
  const activeRoomId = useUiSelector((ui) => ui.activeRoomId);

  return (
    <section className="card room-tabs-card" aria-labelledby="room-tabs-title">
      <div className="room-tabs-card__header">
        <div>
          <p className="overview-section-label">Rooms</p>
          <h3 id="room-tabs-title">Browse rooms</h3>
        </div>
        <span className="overview-counter">{rooms.length} rooms</span>
      </div>

      <div
        className="room-tabs"
        role="tablist"
        aria-label="Habitaciones disponibles"
        aria-orientation="horizontal"
      >
        {rooms.map((room) => {
          const isActive = room.id === activeRoomId;

          return (
            <button
              key={room.id}
              type="button"
              className="room-tab"
              role="tab"
              aria-selected={isActive}
              aria-controls={`room-panel-${room.id}`}
              id={`room-tab-${room.id}`}
              tabIndex={isActive ? 0 : -1}
              aria-label={`Abrir cuarto ${room.name}`}
              onClick={() => actions.setActiveRoom(room.id)}
            >
              <span className="room-tab__label">{room.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
