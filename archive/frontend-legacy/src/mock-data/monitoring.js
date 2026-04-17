export const mockHealthSnapshot = {
  score: 87,
  trend: "+6",
  incidents: 2,
  watchItems: 5,
  coverage: "74%"
};

export const mockEventFeed = [
  {
    id: "evt-1",
    title: "Rebalanceo mock aplicado al panel de alertas",
    timestamp: "2026-04-16T08:34:00.000Z",
    severity: "info"
  },
  {
    id: "evt-2",
    title: "Teams gateway simulado pasó a estado watch",
    timestamp: "2026-04-16T08:12:00.000Z",
    severity: "watch"
  },
  {
    id: "evt-3",
    title: "Se recalculó el score de salud cognitiva del overview",
    timestamp: "2026-04-16T07:58:00.000Z",
    severity: "info"
  },
  {
    id: "evt-4",
    title: "Pipeline placeholder de voz quedó listo para contrato futuro",
    timestamp: "2026-04-16T07:31:00.000Z",
    severity: "success"
  },
  {
    id: "evt-5",
    title: "Integración de Discord mock requiere normalización de estados",
    timestamp: "2026-04-16T07:10:00.000Z",
    severity: "watch"
  }
];
