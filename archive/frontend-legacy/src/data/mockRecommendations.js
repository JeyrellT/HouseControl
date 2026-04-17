import { RECOMMENDATION_PRIORITIES, RECOMMENDATION_TYPES } from "../utils/constants.js";

export const mockRecommendations = [
  {
    id: "recommendation-bedroom-sensor-check",
    type: RECOMMENDATION_TYPES.MAINTENANCE,
    priority: RECOMMENDATION_PRIORITIES.HIGH,
    confidence: 0.94,
    title: "Revisar el sensor climático del dormitorio master",
    rationale:
      "El dispositivo quedó offline y su última señal rompe la continuidad del modelo de confort nocturno.",
    action: "Inspeccionar conectividad y usar fallback del termostato mientras vuelve a línea."
  },
  {
    id: "recommendation-living-light-balance",
    type: RECOMMENDATION_TYPES.OPTIMIZATION,
    priority: RECOMMENDATION_PRIORITIES.HIGH,
    confidence: 0.89,
    title: "Reducir brillo base en Sala principal durante mañanas activas",
    rationale:
      "La iluminación principal estuvo por encima del patrón esperado mientras la tira ambiental ya cubría el nivel de confort visual.",
    action: "Crear preset de 62% para mornings y mover la ambient strip a rol secundario."
  },
  {
    id: "recommendation-studio-focus-scene",
    type: RECOMMENDATION_TYPES.AUTOMATION,
    priority: RECOMMENDATION_PRIORITIES.MEDIUM,
    confidence: 0.84,
    title: "Convertir Focus Studio en automatización contextual",
    rationale:
      "El studio repite la misma combinación de luz, clima y audio en franjas de trabajo profundo.",
    action: "Generar trigger por horario y presencia para simplificar la activación manual."
  },
  {
    id: "recommendation-kitchen-presence-lighting",
    type: RECOMMENDATION_TYPES.COMFORT,
    priority: RECOMMENDATION_PRIORITIES.MEDIUM,
    confidence: 0.8,
    title: "Vincular presencia de cocina con iluminación de paso",
    rationale:
      "El sensor de presencia está estable y la luz principal se mantiene apagada incluso en ventanas de tránsito frecuentes.",
    action: "Probar encendido suave automático al detectar ocupación corta."
  },
  {
    id: "recommendation-ecobee-latency-watch",
    type: RECOMMENDATION_TYPES.MAINTENANCE,
    priority: RECOMMENDATION_PRIORITIES.MEDIUM,
    confidence: 0.77,
    title: "Monitorear latencia de Ecobee antes de nuevas reglas climáticas",
    rationale:
      "La plataforma climática está degradada y podría introducir retrasos en automatizaciones sensibles.",
    action: "Mantener reglas climáticas complejas en modo manual hasta estabilizar el sync."
  },
  {
    id: "recommendation-terrace-sunset-scene",
    type: RECOMMENDATION_TYPES.ENERGY,
    priority: RECOMMENDATION_PRIORITIES.LOW,
    confidence: 0.73,
    title: "Refinar Terrace Sunset con apagado automático",
    rationale:
      "La terraza tiene baja frecuencia de uso y puede ahorrar energía si la escena incluye cutoff temporal.",
    action: "Agregar apagado automático 45 minutos después de la activación."
  }
];
