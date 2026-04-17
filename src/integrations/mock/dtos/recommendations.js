import { RECOMMENDATION_PRIORITIES, RECOMMENDATION_TYPES } from "../../../utils/constants.js";

export const recommendationDtos = [
  {
    id: "recommendation-bedroom-sensor-check",
    type: RECOMMENDATION_TYPES.MAINTENANCE,
    priority: RECOMMENDATION_PRIORITIES.HIGH,
    confidence: 0.94,
    title: "Revisar el sensor climatico del dormitorio master",
    rationale:
      "El dispositivo quedo offline y su ultima senal rompe la continuidad del modelo de confort nocturno.",
    action: "Inspeccionar conectividad y usar fallback del termostato mientras vuelve a linea."
  },
  {
    id: "recommendation-living-light-balance",
    type: RECOMMENDATION_TYPES.OPTIMIZATION,
    priority: RECOMMENDATION_PRIORITIES.HIGH,
    confidence: 0.89,
    title: "Reducir brillo base en Sala principal durante mananas activas",
    rationale:
      "La iluminacion principal estuvo por encima del patron esperado mientras la tira ambiental ya cubria el nivel de confort visual.",
    action: "Crear preset de 62% para mornings y mover la ambient strip a rol secundario."
  },
  {
    id: "recommendation-studio-focus-scene",
    type: RECOMMENDATION_TYPES.AUTOMATION,
    priority: RECOMMENDATION_PRIORITIES.MEDIUM,
    confidence: 0.84,
    title: "Convertir Focus Studio en automatizacion contextual",
    rationale:
      "El studio repite la misma combinacion de luz, clima y audio en franjas de trabajo profundo.",
    action: "Generar trigger por horario y presencia para simplificar la activacion manual."
  },
  {
    id: "recommendation-kitchen-presence-lighting",
    type: RECOMMENDATION_TYPES.COMFORT,
    priority: RECOMMENDATION_PRIORITIES.MEDIUM,
    confidence: 0.8,
    title: "Vincular presencia de cocina con iluminacion de paso",
    rationale:
      "El sensor de presencia esta estable y la luz principal se mantiene apagada incluso en ventanas de transito frecuentes.",
    action: "Probar encendido suave automatico al detectar ocupacion corta."
  },
  {
    id: "recommendation-ecobee-latency-watch",
    type: RECOMMENDATION_TYPES.MAINTENANCE,
    priority: RECOMMENDATION_PRIORITIES.MEDIUM,
    confidence: 0.77,
    title: "Monitorear latencia de Ecobee antes de nuevas reglas climaticas",
    rationale:
      "La plataforma climatica esta degradada y podria introducir retrasos en automatizaciones sensibles.",
    action: "Mantener reglas climaticas complejas en modo manual hasta estabilizar el sync."
  },
  {
    id: "recommendation-terrace-sunset-scene",
    type: RECOMMENDATION_TYPES.ENERGY,
    priority: RECOMMENDATION_PRIORITIES.LOW,
    confidence: 0.73,
    title: "Refinar Terrace Sunset con apagado automatico",
    rationale:
      "La terraza tiene baja frecuencia de uso y puede ahorrar energia si la escena incluye cutoff temporal.",
    action: "Agregar apagado automatico 45 minutos despues de la activacion."
  }
];

