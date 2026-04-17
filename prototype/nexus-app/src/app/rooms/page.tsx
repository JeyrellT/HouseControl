"use client";

import { useState } from "react";
import { useNexus, selectDevicesByPersona, selectRoomsByPersona, selectFloorsByPersona } from "@/lib/store";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { Room3D } from "@/components/rooms/Room3D";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export default function RoomsPage() {
  const personaId = useNexus((s) => s.activePersonaId);
  const rooms = selectRoomsByPersona(personaId);
  const floors = selectFloorsByPersona(personaId);
  const devices = selectDevicesByPersona(personaId);

  const [activeRoomId, setActiveRoomId] = useState<string | null>(rooms[0]?.id ?? null);

  const activeRoom = rooms.find((r) => r.id === activeRoomId);
  const filtered = activeRoomId ? devices.filter((d) => d.roomId === activeRoomId) : devices;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Habitaciones</h1>
        <p className="text-sm text-ink-soft mt-1">Control por ambiente, organizado por planta.</p>
      </div>

      {floors.map((floor) => {
        const floorRooms = rooms.filter((r) => r.floorId === floor.id);
        if (floorRooms.length === 0) return null;
        return (
          <Card key={floor.id} className="p-4">
            <div className="text-xs font-medium uppercase text-ink-soft tracking-wider mb-3">{floor.name}</div>
            <div className="flex flex-wrap gap-2">
              {floorRooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setActiveRoomId(r.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm border transition",
                    activeRoomId === r.id
                      ? "bg-sage/20 border-sage-border text-navy dark:text-sage"
                      : "bg-surface border-line text-ink-soft hover:bg-line",
                  )}
                >
                  {r.name}
                  <span className="ml-2 text-[10px] text-ink-soft/60">
                    {devices.filter((d) => d.roomId === r.id).length}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        );
      })}

      <div>
        <div className="text-sm text-ink-soft mb-3">
          {filtered.length} dispositivo{filtered.length !== 1 ? "s" : ""} en esta habitación
        </div>
        {activeRoom && filtered.length > 0 && (
          <Card className="p-4 mb-4">
            <Room3D devices={filtered} roomName={activeRoom.name} roomId={activeRoom.id} />
          </Card>
        )}
        {filtered.length === 0 ? (
          <Card className="p-10 text-center text-ink-soft">
            Esta habitación no tiene dispositivos registrados.
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((d) => <DeviceCard key={d.id} device={d} />)}
          </div>
        )}
      </div>
    </div>
  );
}
