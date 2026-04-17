import { SCENE_ROOM_SCOPE } from "../../../utils/constants.js";

export const sceneDtos = [
  {
    id: "scene-welcome-home",
    name: "Welcome Home",
    roomScope: SCENE_ROOM_SCOPE.GLOBAL,
    description: "Enciende iluminacion principal, activa audio ambiental y ajusta clima a confort."
  },
  {
    id: "scene-focus-studio",
    name: "Focus Studio",
    roomScope: "room-studio",
    description: "Sube luz de escritorio, reduce distracciones y prepara el ambiente para trabajo profundo."
  },
  {
    id: "scene-evening-living",
    name: "Evening Living",
    roomScope: "room-living",
    description: "Baja intensidad luminica, activa luz ambiental y reproduce escena de audio suave."
  },
  {
    id: "scene-night-routine",
    name: "Night Routine",
    roomScope: SCENE_ROOM_SCOPE.GLOBAL,
    description: "Apaga zonas comunes, cierra persianas y deja sensores listos para modo nocturno."
  },
  {
    id: "scene-terrace-sunset",
    name: "Terrace Sunset",
    roomScope: "room-terrace",
    description: "Activa iluminacion exterior tenue para transicion de tarde a noche."
  }
];

