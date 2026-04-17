export const mockRecommendations = [
  {
    id: "rec-load-balancing",
    title: "Ajustar exposición de alertas de alta fricción",
    summary: "Reducir señales repetidas en monitoreo primario para disminuir ruido operativo.",
    priority: "critical",
    confidence: 92,
    impact: 24,
    domain: "monitoring",
    status: "open",
    owner: "Ops Design",
    updatedAt: "2026-04-16T08:30:00.000Z"
  },
  {
    id: "rec-recommendation-explainability",
    title: "Destacar factores de decisión en recomendaciones",
    summary: "Hacer visible el porqué detrás de cada sugerencia para elevar confianza y adopción.",
    priority: "high",
    confidence: 88,
    impact: 19,
    domain: "recommendations",
    status: "open",
    owner: "AI Experience",
    updatedAt: "2026-04-16T07:55:00.000Z"
  },
  {
    id: "rec-platform-readiness",
    title: "Preparar placeholders de adapters multi-plataforma",
    summary: "Unificar estados y contratos para Slack, Teams y Discord antes de conectar servicios reales.",
    priority: "high",
    confidence: 81,
    impact: 16,
    domain: "platforms",
    status: "watch",
    owner: "Integration Layer",
    updatedAt: "2026-04-15T23:40:00.000Z"
  },
  {
    id: "rec-voice-latency",
    title: "Modelar una ruta de comandos de voz segura",
    summary: "Definir fallback visual y estados de confianza antes de incorporar voz real.",
    priority: "medium",
    confidence: 76,
    impact: 12,
    domain: "voice",
    status: "planned",
    owner: "Interaction Systems",
    updatedAt: "2026-04-15T22:10:00.000Z"
  }
];

export const mockRecommendationExplanations = {
  "rec-load-balancing": {
    recommendationId: "rec-load-balancing",
    whyShown: "El feed simulado presenta eventos duplicados y señales de watch persistentes.",
    signals: ["Tasa de eventos repetidos +18%", "2 plataformas en watch", "Score cognitivo de alerta alto"],
    expectedOutcome: "Mejor lectura del overview y decisiones más rápidas en el panel primario.",
    riskLevel: "Medio",
    userFacingReason: "Nexus prioriza esta sugerencia porque reduce ruido y mejora la atención sobre incidentes relevantes."
  },
  "rec-recommendation-explainability": {
    recommendationId: "rec-recommendation-explainability",
    whyShown: "La experiencia enterprise exige justificar recomendaciones antes de automatizar decisiones.",
    signals: ["Recomendaciones abiertas", "Motor explicable requerido", "Confianza > 85%"],
    expectedOutcome: "Mayor adopción de sugerencias y mejor trazabilidad para auditoría interna.",
    riskLevel: "Bajo",
    userFacingReason:
      "Nexus muestra esta acción porque aumenta transparencia y permite entender qué señales activaron la recomendación."
  },
  "rec-platform-readiness": {
    recommendationId: "rec-platform-readiness",
    whyShown: "La arquitectura debe crecer hacia múltiples plataformas sin reescribir contratos de estado.",
    signals: ["3 plataformas mock", "Gateway en standby", "Adapters externos fuera de alcance"],
    expectedOutcome: "Escalado más rápido cuando se activen integraciones reales.",
    riskLevel: "Medio",
    userFacingReason: "Nexus detecta una oportunidad de estandarización previa a la conexión con plataformas externas."
  },
  "rec-voice-latency": {
    recommendationId: "rec-voice-latency",
    whyShown: "El roadmap contempla voz y conviene dejar estados de confianza visibles desde ahora.",
    signals: ["Servicio placeholder listo", "Modo mock activo", "Capa cognitiva futura"],
    expectedOutcome: "Menor retrabajo al incorporar comandos de voz y adaptación contextual.",
    riskLevel: "Bajo",
    userFacingReason: "Nexus sugiere preparar la experiencia de voz antes de activar procesamiento real."
  }
};
