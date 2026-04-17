# Intelligent Nexus — Prototipo MVP

Sistema unificado de control domótico (residencial · oficina · agrícola). Implementación Next.js 14 (App Router) + TypeScript + Tailwind + Zustand.

## Ejecutar

```bash
cd prototype/nexus-app
npm install      # ~2 min, 433 paquetes
npm run dev      # http://localhost:3000
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Dev server con HMR |
| `npm run build` | Build de producción |
| `npm run start` | Servidor producción |
| `npm run typecheck` | TS strict sin emit |
| `npm run lint` | ESLint Next.js |

## Stack

- **Next.js 14.2.15** App Router, RSC + Client Components
- **TypeScript 5.6** strict mode
- **Tailwind 3.4** paleta sage/gold/navy/smoke/cream + status colors + tema claro/oscuro CSS-vars
- **Zustand 4.5** store con `persist` middleware (`activePersonaId`, `presentationMode`, `density`, `activeRole`)
- **mitt 3.0** event bus tipado (`NexusEvent`)
- **lucide-react** iconografía
- **next-themes** soporte dark mode
- **recharts** (instalado, listo para gráficos energía/sparklines)
- **framer-motion** (instalado, listo para microanimaciones)

## Arquitectura del prototipo

```
src/
├── app/                     # Next.js App Router
│   ├── layout.tsx           # ThemeProvider + AppShell wrapper
│   ├── page.tsx             # → redirect /dashboard
│   ├── dashboard/           # KPIs + actividad + escenas + salud
│   ├── rooms/               # Tabs por planta + grid dispositivos
│   ├── devices/             # Inventario filtrable
│   ├── scenes/              # Catálogo escenas activables
│   ├── voice/               # Asistente voz simulado + 7 intents
│   ├── audit/               # Bitácora con export CSV
│   ├── health/              # Disponibilidad, gateways, latencia
│   ├── energy/              # Consumo estimado + costo + CO₂
│   ├── integrations/        # Plataformas + OAuth + cuotas
│   ├── rules/               # Reglas mock (motor real diferido)
│   └── settings/            # Tema, densidad, RBAC, reset
├── components/
│   ├── layout/              # AppShell, Sidebar, Topbar
│   ├── dashboard/           # ActivityTimeline, ScenesPanel, PlatformHealth
│   ├── devices/             # DeviceCard, DeviceIcon
│   ├── ui/                  # Card, Badge, Switch, KPI
│   └── theme-provider.tsx
├── lib/
│   ├── types.ts             # Modelo dominio completo
│   ├── store.ts             # Zustand + selectors
│   ├── event-bus.ts         # mitt tipado + helper emit()
│   └── utils.ts             # cn() helper
└── data/
    └── seed.ts              # Mock dataset (3 personas, 22 dispositivos, 8 escenas, 15 eventos)
```

## Personas incluidas

| Persona | Tipo | Dispositivos | Escenas |
|---|---|---|---|
| **Villa Aurora** (primaria) | residential | 16 | 5 |
| Nexus HQ | office | 3 | 2 |
| Finca Las Palmas | agricultural | 3 | 1 |

## Funcionalidades implementadas

- ✅ Multi-sitio con selector en topbar
- ✅ Toggle dispositivos (genera `command.ack` + `device.state.changed` + entrada de actividad)
- ✅ Activación de escenas (aplica `targetStates` a capabilities)
- ✅ 7 intents de voz simulados con historial
- ✅ Tema claro/oscuro persistente
- ✅ RBAC visual (owner/admin/technician/viewer) — viewer deshabilita controles
- ✅ Modo presentación (oculta controles dev)
- ✅ Densidad minimal/dense
- ✅ Reset demo
- ✅ Estimación energética con costo en CRC y huella CO₂
- ✅ Auditoría con export CSV
- ✅ Persistencia parcial vía localStorage (Zustand persist middleware)

## Funcionalidades planificadas (diferidas)

Las 15 sesiones de planificación previa están guardadas en `/memories/session/`. Pendiente de futuras iteraciones:

- Adapters reales por vendor (interfaces `IDeviceAdapter`, simulación de latencia, retry/backoff)
- Motor de reglas DSL extensible (Rev 6)
- Pantallas adicionales: `/compare`, `/roi`, `/case-studies`, `/interop`, `/spatial`, `/install`, `/ai/routing`
- Migración a TanStack Query para state remoto
- Middleware OWASP (CSP/HSTS/CSRF)
- Generación PDF reportes
- Tour onboarding (react-joyride)
- WebSockets reales (placeholder en `event-bus.ts`)
- i18n EN/ES (actualmente solo ES)
- Tests E2E (Playwright) y unitarios (Vitest)
- Telemetría OpenTelemetry

## Notas

- El proyecto vive en `prototype/nexus-app/` separado de la app Vite existente en raíz (legacy).
- Toda mutación pasa por `useNexus` (Zustand) + emite evento al `eventBus` para futuras integraciones.
- Las constantes mock viven en `src/data/seed.ts` — modificar ahí para añadir/quitar dispositivos.
