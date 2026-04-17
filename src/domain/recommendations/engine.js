import { DEVICE_TYPES } from "../../utils/constants.js";
import { selectCollectionItems } from "../../state/selectors.js";

function isNightTime(now) {
  const hours = now.getHours();
  return hours >= 19 || hours < 6;
}

function buildRecommendation(id, priority, title, rationale, action) {
  return {
    id,
    type: "automation",
    priority,
    confidence: 0.75,
    title,
    rationale,
    action
  };
}

export function evaluateRecommendations(state, now = new Date()) {
  const devices = selectCollectionItems(state.devices);
  const roomsById = state.rooms.byId;
  const nextRecommendations = [];
  const activeTv = devices.find((device) => {
    const lowerName = device.name.toLowerCase();

    return (
      (device.type === "tv" || lowerName.includes("tv")) &&
      device.online &&
      (device.state?.power || device.state?.playing)
    );
  });
  const activeLights = devices.filter(
    (device) => device.type === DEVICE_TYPES.LIGHT && device.online && device.state?.power
  );
  const unlockedDoors = devices.filter(
    (device) => device.type === DEVICE_TYPES.DOOR && device.online && device.state?.locked === false
  );

  if (activeTv && isNightTime(now)) {
    const roomName = roomsById[activeTv.roomId]?.name ?? "la sala";

    nextRecommendations.push(
      buildRecommendation(
        "engine-movie-scene",
        "medium",
        "Sugerir movie scene para sesion nocturna",
        `Se detecto un TV activo en ${roomName} durante horario nocturno.`,
        "Ofrecer una escena de cine con luz baja y audio ambiental reducido."
      )
    );
  }

  if (activeLights.length >= 4) {
    nextRecommendations.push(
      buildRecommendation(
        "engine-light-balance",
        "medium",
        "Reducir luces activas para ahorrar energia",
        `Hay ${activeLights.length} luces encendidas al mismo tiempo en el hogar.`,
        "Sugerir apagar luces secundarias o aplicar una escena de menor consumo."
      )
    );
  }

  if (unlockedDoors.length > 0 && isNightTime(now)) {
    const primaryDoor = unlockedDoors[0];
    const roomName = roomsById[primaryDoor.roomId]?.name ?? "un acceso";

    nextRecommendations.push(
      buildRecommendation(
        "engine-lock-all",
        "high",
        "Sugerir lock all antes de cerrar el dia",
        `Hay una puerta sin asegurar en ${roomName} durante horario nocturno.`,
        "Mostrar accion rapida para cerrar accesos y dejar la casa en modo seguro."
      )
    );
  }

  return nextRecommendations;
}

