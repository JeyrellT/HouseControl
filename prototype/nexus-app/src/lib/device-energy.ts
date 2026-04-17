// Perfiles de consumo energético realistas para los dispositivos del seed.
// Los valores son "placa" (W pico) + un factor de uso derivado del estado actual
// de las capabilities para estimar consumo instantáneo.

import type { Capability, Device, DeviceKind, Room } from "./types";

// Watts por kind como fallback cuando no hay override específico.
export const KIND_BASE_W: Record<DeviceKind, number> = {
  light: 12,     // LED promedio
  switch: 0,     // requiere override por device
  sensor: 0.3,   // battery
  lock: 3,
  cover: 50,     // motor persiana
  climate: 1500, // inverter split
  camera: 8,
  speaker: 25,
  valve: 5,
};

// Overrides por device id con potencia nominal y si consume 24/7 o sólo cuando está "on".
// duty: fracción de tiempo que realmente está consumiendo cuando el "on_off" = true.
export interface DeviceEnergyProfile {
  ratedW: number;       // pico nominal
  idleW?: number;       // en standby o ciclo no activo
  always?: boolean;     // si consume incluso cuando on_off = false (ej. refri con ciclo)
  duty?: number;        // 0..1 — fracción del tiempo que está al pico
  category: "electrodoméstico" | "climatización" | "iluminación" | "entretenimiento" | "seguridad" | "otros" | "movilidad" | "oficina";
}

export const DEVICE_PROFILES: Record<string, DeviceEnergyProfile> = {
  // Electrodomésticos pesados
  "dev-cocina-refri": { ratedW: 180, idleW: 45, always: true, duty: 0.35, category: "electrodoméstico" },
  "dev-cocina-horno": { ratedW: 2400, duty: 1, category: "electrodoméstico" },
  "dev-cocina-induccion": { ratedW: 2800, duty: 0.75, category: "electrodoméstico" },
  "dev-cocina-micro": { ratedW: 1200, duty: 1, category: "electrodoméstico" },
  "dev-cocina-lavav": { ratedW: 1800, duty: 0.55, category: "electrodoméstico" },
  "dev-cocina-cafetera": { ratedW: 1350, duty: 1, category: "electrodoméstico" },
  "dev-cocina-extractor": { ratedW: 220, duty: 0.9, category: "electrodoméstico" },
  "dev-lav-lavadora": { ratedW: 500, duty: 0.4, category: "electrodoméstico" },
  "dev-lav-secadora": { ratedW: 3000, duty: 0.75, category: "electrodoméstico" },
  "dev-lav-calentador": { ratedW: 4500, idleW: 80, always: true, duty: 0.3, category: "electrodoméstico" },

  // Climatización (valor base cuando está "cool" activo; varía con ΔT)
  "dev-sala-clima": { ratedW: 1500, idleW: 20, duty: 0.7, category: "climatización" },
  "dev-master-clima": { ratedW: 1300, idleW: 15, duty: 0.65, category: "climatización" },
  "dev-hijos-clima": { ratedW: 1100, idleW: 15, duty: 0.6, category: "climatización" },

  // Entretenimiento
  "dev-sala-tv": { ratedW: 180, idleW: 3, category: "entretenimiento" },
  "dev-sala-tv-speaker": { ratedW: 35, idleW: 4, category: "entretenimiento" },
  "dev-terraza-speaker": { ratedW: 30, idleW: 3, category: "entretenimiento" },
  "dev-estudio-speaker": { ratedW: 25, idleW: 3, category: "entretenimiento" },
  "dev-estudio-pc": { ratedW: 450, idleW: 30, category: "oficina" },

  // Seguridad / cámaras (24/7)
  "dev-jardin-cam": { ratedW: 9, always: true, category: "seguridad" },
  "dev-entrada-cam": { ratedW: 9, always: true, category: "seguridad" },
  "dev-garage-cam": { ratedW: 9, always: true, category: "seguridad" },
  "dev-finca-cam": { ratedW: 8, always: true, category: "seguridad" },

  // Movilidad
  "dev-garage-ev": { ratedW: 7200, duty: 0.95, category: "movilidad" },
  "dev-garage-bomba": { ratedW: 750, duty: 1, category: "otros" },
};

// Calcula watts instantáneos para un dispositivo dado su estado actual.
export function deviceInstantW(device: Device, capabilities: Record<string, Capability>): number {
  const profile = DEVICE_PROFILES[device.id];
  const caps = device.capabilityIds.map((id) => capabilities[id]).filter(Boolean) as Capability[];
  const onCap = caps.find((c) => c.kind === "on_off");
  const thermoCap = caps.find((c) => c.kind === "thermostat");
  const dimCap = caps.find((c) => c.kind === "dim");
  const audioCap = caps.find((c) => c.kind === "audio");
  const motionCap = caps.find((c) => c.kind === "motion");

  // Con perfil explícito
  if (profile) {
    // Climatización: modula por modo y ΔT
    if (device.kind === "climate" && thermoCap && typeof thermoCap.value === "object" && thermoCap.value !== null) {
      const v = thermoCap.value as { mode?: string; target?: number; current?: number };
      if (v.mode === "off") return profile.idleW ?? 5;
      const delta = Math.abs((v.current ?? v.target ?? 24) - (v.target ?? 24));
      const modFactor = 0.4 + Math.min(delta / 4, 1) * 0.6; // 0.4..1.0
      return Math.round(profile.ratedW * (profile.duty ?? 1) * modFactor);
    }

    // Siempre encendidos (refri, cámaras, calentador con termostato interno)
    if (profile.always) {
      const isOn = onCap?.value === true;
      return Math.round((isOn ? profile.ratedW : (profile.idleW ?? 0)) * (profile.duty ?? 1));
    }

    // Encendido/apagado binario
    if (onCap?.value === true) {
      return Math.round(profile.ratedW * (profile.duty ?? 1));
    }
    return profile.idleW ?? 0;
  }

  // Fallbacks por kind
  const base = KIND_BASE_W[device.kind] ?? 0;
  if (device.kind === "climate") {
    if (thermoCap && typeof thermoCap.value === "object" && thermoCap.value !== null) {
      const v = thermoCap.value as { mode?: string; target?: number; current?: number };
      if (v.mode === "off") return 5;
      const delta = Math.abs((v.current ?? 24) - (v.target ?? 24));
      return Math.round(base * (0.4 + Math.min(delta / 4, 1) * 0.6));
    }
    return base;
  }
  if (device.kind === "camera") return base; // 24/7
  if (device.kind === "sensor") return base;
  if (device.kind === "light") {
    if (onCap?.value !== true) return 0;
    const dim = typeof dimCap?.value === "number" ? (dimCap.value as number) / 100 : 1;
    return Math.round(base * Math.max(0.1, dim));
  }
  if (device.kind === "speaker") {
    const v = audioCap?.value as { playing?: boolean } | undefined;
    return v?.playing ? base : Math.round(base * 0.15);
  }
  if (device.kind === "cover") {
    // Sólo consume cuando se mueve (aprox 0 la mayor parte del tiempo)
    return motionCap?.value === true ? base : 0;
  }
  if (onCap?.value === true) return base;
  return 0;
}

export function deviceCategoryLabel(device: Device): DeviceEnergyProfile["category"] {
  return DEVICE_PROFILES[device.id]?.category ?? (
    device.kind === "camera" ? "seguridad" :
    device.kind === "climate" ? "climatización" :
    device.kind === "light" ? "iluminación" :
    device.kind === "speaker" ? "entretenimiento" :
    "otros"
  );
}

// Tarifa eléctrica Costa Rica (ilustrativa, bloque residencial ICE)
export const CRC_PER_KWH = 95;       // ₡ promedio por kWh
export const CO2_KG_PER_KWH = 0.18;  // factor emisión CR (alto % hidro)

// ---------- Auditoría profunda ----------

export interface DeviceAudit {
  id: string;
  name: string;
  room: string;
  kind: string;
  category: DeviceEnergyProfile["category"];
  watts: number;
  ratedW: number;
  kwhDay: number;
  kwhMonth: number;
  costMonth: number;
  co2Month: number;
  always: boolean;
  isOn: boolean;
  // Análisis
  efficiency: "eficiente" | "normal" | "ineficiente" | "crítico"; // vs su clase
  efficiencyScore: number; // 0-100
  phantomW: number;        // consumo en standby
  flags: string[];         // etiquetas de anomalías
}

export interface EnergyAudit {
  totalW: number;
  activeCount: number;
  peakWEstimate: number;
  coincidenceFactor: number;    // 0..1 — cuánto coincide el pico con otros dispositivos
  dailyKwh: number;
  monthlyKwh: number;
  monthlyCRC: number;
  co2KgMonth: number;
  phantomW: number;             // total standby
  phantomKwhMonth: number;
  phantomCRCMonth: number;
  benchmark: {
    crAverageKwh: number;       // hogar CR promedio ~230 kWh/mes
    crPremiumKwh: number;       // residencia premium ~450 kWh
    position: "bajo" | "promedio" | "alto" | "muy_alto";
    pctVsAverage: number;
  };
  efficiencyScore: number;      // 0..100 global
  devices: DeviceAudit[];
  byCategory: Array<{ category: string; watts: number; kwhMonth: number; costMonth: number; pct: number }>;
  byRoom: Array<{ room: string; watts: number; kwhMonth: number; costMonth: number; pct: number }>;
  byTariff: {
    pico: { kwh: number; cost: number };
    medio: { kwh: number; cost: number };
    valle: { kwh: number; cost: number };
  };
  topConsumers: DeviceAudit[];
  anomalies: Array<{
    severity: "info" | "warn" | "critical";
    title: string;
    detail: string;
    deviceIds?: string[];
    estimatedMonthlyWasteCRC?: number;
  }>;
  opportunities: Array<{
    title: string;
    impact: "alto" | "medio" | "bajo";
    estimatedSavingsCRC: number;  // ₡/mes
    estimatedSavingsKwh: number;
    paybackMonths?: number;       // si aplica inversión
    category: string;
    rationale: string;
  }>;
  riskFlags: string[];
}

// Benchmarks ICE / AYA aproximados
const CR_AVG_KWH_MONTH = 230;
const CR_PREMIUM_KWH_MONTH = 450;

// Referencias de consumo típico por clase (W nominales razonables)
const TYPICAL_BY_KIND: Partial<Record<DeviceKind, number>> = {
  light: 10, camera: 8, speaker: 25, sensor: 0.3, lock: 3,
  cover: 60, climate: 1300, valve: 5, switch: 0,
};

function classifyEfficiency(device: Device, watts: number): { rating: DeviceAudit["efficiency"]; score: number } {
  const profile = DEVICE_PROFILES[device.id];
  const typical = profile?.ratedW ?? TYPICAL_BY_KIND[device.kind] ?? 0;
  if (typical <= 0) return { rating: "normal", score: 75 };
  const ratio = watts / typical;
  if (ratio <= 0.4) return { rating: "eficiente", score: 92 };
  if (ratio <= 0.8) return { rating: "normal", score: 78 };
  if (ratio <= 1.1) return { rating: "normal", score: 65 };
  if (ratio <= 1.4) return { rating: "ineficiente", score: 45 };
  return { rating: "crítico", score: 25 };
}

export function buildEnergyAudit(
  devices: Device[],
  capabilities: Record<string, Capability>,
  rooms: Room[],
): EnergyAudit {
  const audits: DeviceAudit[] = devices.map((d) => {
    const profile = DEVICE_PROFILES[d.id];
    const caps = d.capabilityIds.map((id) => capabilities[id]).filter(Boolean) as Capability[];
    const onCap = caps.find((c) => c.kind === "on_off");
    const isOn = onCap?.value === true;
    const watts = deviceInstantW(d, capabilities);
    const ratedW = profile?.ratedW ?? TYPICAL_BY_KIND[d.kind] ?? 0;
    const category = deviceCategoryLabel(d);
    const room = rooms.find((r) => r.id === d.roomId)?.name ?? "—";
    const kwhDay = +((watts * 24) / 1000).toFixed(3);
    const kwhMonth = +(kwhDay * 30).toFixed(2);
    const costMonth = Math.round(kwhMonth * CRC_PER_KWH);
    const co2Month = +(kwhMonth * CO2_KG_PER_KWH).toFixed(2);
    const { rating, score } = classifyEfficiency(d, watts);
    const phantomW = (!isOn && profile?.idleW) ? profile.idleW : (profile?.always && !isOn ? (profile.idleW ?? 0) : 0);

    const flags: string[] = [];
    if (profile?.always) flags.push("24/7");
    if (phantomW > 0) flags.push("standby");
    if (watts > 2000) flags.push("alto-consumo");
    if (rating === "crítico") flags.push("ineficiente");
    if (category === "entretenimiento" && isOn && watts > 100) flags.push("ocio-encendido");
    if (d.kind === "climate" && watts > 1800) flags.push("clima-forzado");

    return {
      id: d.id, name: d.name, room, kind: d.kind, category,
      watts, ratedW, kwhDay, kwhMonth, costMonth, co2Month,
      always: !!profile?.always, isOn,
      efficiency: rating, efficiencyScore: score,
      phantomW, flags,
    };
  });

  const totalW = audits.reduce((s, a) => s + a.watts, 0);
  const active = audits.filter((a) => a.watts > 0);
  const dailyKwh = +(totalW * 24 / 1000).toFixed(2);
  const monthlyKwh = +(dailyKwh * 30).toFixed(1);
  const monthlyCRC = Math.round(monthlyKwh * CRC_PER_KWH);
  const co2KgMonth = +(monthlyKwh * CO2_KG_PER_KWH).toFixed(1);

  // Pico: suma de ratedW de dispositivos no-24/7 con probabilidad de coincidir
  const switchable = audits.filter((a) => !a.always && a.ratedW > 500);
  const peakWEstimate = Math.round(
    audits.filter((a) => a.always).reduce((s, a) => s + a.watts, 0) +
    switchable.reduce((s, a) => s + a.ratedW * 0.6, 0),
  );
  const coincidenceFactor = switchable.length
    ? +(active.filter((a) => a.ratedW > 500).length / switchable.length).toFixed(2)
    : 0;

  // Carga fantasma (standby)
  const phantomW = audits.reduce((s, a) => s + a.phantomW, 0);
  const phantomKwhMonth = +(phantomW * 24 * 30 / 1000).toFixed(1);
  const phantomCRCMonth = Math.round(phantomKwhMonth * CRC_PER_KWH);

  // Benchmark
  const pctVsAverage = Math.round((monthlyKwh / CR_AVG_KWH_MONTH) * 100);
  let position: EnergyAudit["benchmark"]["position"] = "promedio";
  if (monthlyKwh < CR_AVG_KWH_MONTH * 0.75) position = "bajo";
  else if (monthlyKwh > CR_PREMIUM_KWH_MONTH * 1.25) position = "muy_alto";
  else if (monthlyKwh > CR_PREMIUM_KWH_MONTH) position = "alto";

  // Por categoría / habitación
  const aggBy = (key: "category" | "room") => {
    const map = new Map<string, { watts: number; kwhMonth: number }>();
    audits.forEach((a) => {
      const k = (a as any)[key];
      const cur = map.get(k) ?? { watts: 0, kwhMonth: 0 };
      cur.watts += a.watts;
      cur.kwhMonth += a.kwhMonth;
      map.set(k, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({
        [key]: name,
        watts: Math.round(v.watts),
        kwhMonth: +v.kwhMonth.toFixed(1),
        costMonth: Math.round(v.kwhMonth * CRC_PER_KWH),
        pct: Math.round((v.watts / Math.max(totalW, 1)) * 100),
      }))
      .filter((x) => x.watts > 0)
      .sort((a, b) => b.watts - a.watts) as Array<any>;
  };
  const byCategory = aggBy("category");
  const byRoom = aggBy("room");

  // Distribución tarifaria (hábito típico modelado)
  const dist = { pico: 0.35, medio: 0.45, valle: 0.20 }; // fracción del consumo
  const byTariff = {
    pico:  { kwh: +(monthlyKwh * dist.pico).toFixed(1), cost: Math.round(monthlyKwh * dist.pico * 120) },
    medio: { kwh: +(monthlyKwh * dist.medio).toFixed(1), cost: Math.round(monthlyKwh * dist.medio * 95) },
    valle: { kwh: +(monthlyKwh * dist.valle).toFixed(1), cost: Math.round(monthlyKwh * dist.valle * 75) },
  };

  const topConsumers = [...active].sort((a, b) => b.watts - a.watts).slice(0, 10);

  // Anomalías
  const anomalies: EnergyAudit["anomalies"] = [];
  const heavySimul = active.filter((a) => a.watts > 1500);
  if (heavySimul.length >= 2) {
    anomalies.push({
      severity: "warn",
      title: `${heavySimul.length} dispositivos de alto consumo simultáneos`,
      detail: `${heavySimul.map((x) => x.name).join(", ")} están funcionando a la vez. Escalonar su uso evita picos tarifarios.`,
      deviceIds: heavySimul.map((x) => x.id),
      estimatedMonthlyWasteCRC: Math.round(heavySimul.reduce((s, x) => s + x.watts, 0) * 4 / 1000 * 25 * CRC_PER_KWH * 0.15),
    });
  }
  const entOn = active.filter((a) => a.category === "entretenimiento" && a.watts > 50);
  if (entOn.length >= 2) {
    anomalies.push({
      severity: "info",
      title: "Entretenimiento simultáneo",
      detail: `${entOn.length} dispositivos de entretenimiento activos (TV, audio). Considera apagar los no usados.`,
      deviceIds: entOn.map((x) => x.id),
      estimatedMonthlyWasteCRC: Math.round(entOn.reduce((s, x) => s + x.watts * 0.5, 0) * 24 * 30 / 1000 * CRC_PER_KWH),
    });
  }
  const criticos = audits.filter((a) => a.efficiency === "crítico" && a.watts > 100);
  if (criticos.length > 0) {
    anomalies.push({
      severity: "critical",
      title: `${criticos.length} dispositivos con eficiencia crítica`,
      detail: `Consumen >40% más que equipos de su clase: ${criticos.slice(0, 3).map((x) => x.name).join(", ")}. Considera reemplazo o servicio.`,
      deviceIds: criticos.map((x) => x.id),
      estimatedMonthlyWasteCRC: Math.round(criticos.reduce((s, x) => s + (x.watts - x.ratedW * 0.7) * 24 * 30 / 1000, 0) * CRC_PER_KWH),
    });
  }
  if (phantomW > 30) {
    anomalies.push({
      severity: "info",
      title: `Carga fantasma: ${phantomW} W continuos`,
      detail: `Dispositivos en standby consumen ~${phantomKwhMonth} kWh/mes (₡${phantomCRCMonth}). Un regletero inteligente puede eliminarla.`,
      estimatedMonthlyWasteCRC: phantomCRCMonth,
    });
  }
  if (byTariff.pico.kwh / Math.max(monthlyKwh, 1) > 0.4) {
    anomalies.push({
      severity: "warn",
      title: "Uso elevado en franja pico",
      detail: `${Math.round(byTariff.pico.kwh / monthlyKwh * 100)}% del consumo ocurre en franja pico (₡120/kWh). Desplazar lavadora/secadora/EV a franja valle puede ahorrar ~₡${Math.round((120 - 75) * byTariff.pico.kwh * 0.4)}.`,
      estimatedMonthlyWasteCRC: Math.round((120 - 75) * byTariff.pico.kwh * 0.4),
    });
  }

  // Oportunidades accionables con ROI
  const opportunities: EnergyAudit["opportunities"] = [];
  const evCharger = audits.find((a) => a.id === "dev-garage-ev" && a.watts > 1000);
  if (evCharger) {
    opportunities.push({
      title: "Programar carga EV en franja valle (22h-6h)",
      impact: "alto",
      estimatedSavingsKwh: 0,
      estimatedSavingsCRC: Math.round(evCharger.kwhMonth * (120 - 75)),
      category: "movilidad",
      rationale: "Mismo consumo, ₡45/kWh más barato en franja valle.",
    });
  }
  const calentador = audits.find((a) => a.id === "dev-lav-calentador");
  if (calentador && calentador.kwhMonth > 20) {
    opportunities.push({
      title: "Instalar calentador solar para agua caliente",
      impact: "alto",
      estimatedSavingsKwh: Math.round(calentador.kwhMonth * 0.7),
      estimatedSavingsCRC: Math.round(calentador.kwhMonth * 0.7 * CRC_PER_KWH),
      paybackMonths: Math.round(650000 / Math.max(calentador.kwhMonth * 0.7 * CRC_PER_KWH, 1)),
      category: "electrodoméstico",
      rationale: "El calentador eléctrico representa ~30% del consumo residencial típico. Solar térmico recupera inversión en 2-4 años.",
    });
  }
  const ac = audits.filter((a) => a.kind === "climate" && a.watts > 500);
  if (ac.length > 0) {
    const acMonth = ac.reduce((s, a) => s + a.kwhMonth, 0);
    opportunities.push({
      title: "Subir setpoint A/C 1°C (24°C → 25°C)",
      impact: "medio",
      estimatedSavingsKwh: +(acMonth * 0.06).toFixed(1),
      estimatedSavingsCRC: Math.round(acMonth * 0.06 * CRC_PER_KWH),
      category: "climatización",
      rationale: "Cada grado adicional reduce ~6-8% el consumo del A/C sin sacrificar confort.",
    });
  }
  if (phantomW > 20) {
    opportunities.push({
      title: "Regletero inteligente para TV/audio/PC",
      impact: "bajo",
      estimatedSavingsKwh: phantomKwhMonth,
      estimatedSavingsCRC: phantomCRCMonth,
      paybackMonths: Math.round(15000 / Math.max(phantomCRCMonth, 1)),
      category: "entretenimiento",
      rationale: `Elimina ${phantomW} W de standby continuo.`,
    });
  }
  const secadora = audits.find((a) => a.id === "dev-lav-secadora");
  if (secadora) {
    opportunities.push({
      title: "Tendedero exterior 3 días/semana",
      impact: "medio",
      estimatedSavingsKwh: +(secadora.ratedW * 2 * 12 / 1000).toFixed(1),
      estimatedSavingsCRC: Math.round(secadora.ratedW * 2 * 12 / 1000 * CRC_PER_KWH),
      category: "electrodoméstico",
      rationale: "Clima CR favorable la mayor parte del año. Secadora es el mayor consumidor residencial evitable.",
    });
  }
  if (monthlyKwh > 350) {
    const solarKwp = Math.round(monthlyKwh / 120);
    const solarCost = solarKwp * 850000;
    const solarSavings = Math.round(monthlyKwh * 0.7 * CRC_PER_KWH);
    opportunities.push({
      title: `Sistema solar FV ${solarKwp} kWp (net metering)`,
      impact: "alto",
      estimatedSavingsKwh: Math.round(monthlyKwh * 0.7),
      estimatedSavingsCRC: solarSavings,
      paybackMonths: Math.round(solarCost / Math.max(solarSavings, 1)),
      category: "otros",
      rationale: "Consumo justifica sistema FV. ICE permite net metering para residenciales.",
    });
  }
  opportunities.sort((a, b) => b.estimatedSavingsCRC - a.estimatedSavingsCRC);

  // Score global
  const effAvg = active.length
    ? active.reduce((s, a) => s + a.efficiencyScore, 0) / active.length
    : 80;
  const benchmarkPenalty = position === "muy_alto" ? 25 : position === "alto" ? 10 : 0;
  const phantomPenalty = Math.min(phantomW / 10, 15);
  const anomalyPenalty = anomalies.filter((a) => a.severity === "critical").length * 10
    + anomalies.filter((a) => a.severity === "warn").length * 4;
  const efficiencyScore = Math.max(0, Math.min(100, Math.round(effAvg - benchmarkPenalty - phantomPenalty - anomalyPenalty)));

  const riskFlags: string[] = [];
  if (peakWEstimate > 12000) riskFlags.push("Pico estimado >12 kW — verificar capacidad del breaker principal");
  if (heavySimul.length >= 3) riskFlags.push("Múltiples cargas pesadas simultáneas aumentan riesgo de disparo");
  if (criticos.length > 0) riskFlags.push("Equipos con eficiencia crítica pueden indicar fallas o desgaste");

  return {
    totalW, activeCount: active.length, peakWEstimate, coincidenceFactor,
    dailyKwh, monthlyKwh, monthlyCRC, co2KgMonth,
    phantomW, phantomKwhMonth, phantomCRCMonth,
    benchmark: {
      crAverageKwh: CR_AVG_KWH_MONTH,
      crPremiumKwh: CR_PREMIUM_KWH_MONTH,
      position, pctVsAverage,
    },
    efficiencyScore,
    devices: audits,
    byCategory, byRoom, byTariff,
    topConsumers,
    anomalies, opportunities, riskFlags,
  };
}
