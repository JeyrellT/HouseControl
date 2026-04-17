"use client";

import {
  Lightbulb, Camera, Lock, DoorOpen, Thermometer, Speaker,
  Droplets, Activity, ToggleLeft, type LucideIcon,
} from "lucide-react";
import type { DeviceKind } from "@/lib/types";

const ICONS: Record<DeviceKind, LucideIcon> = {
  light: Lightbulb,
  switch: ToggleLeft,
  sensor: Activity,
  lock: Lock,
  cover: DoorOpen,
  climate: Thermometer,
  camera: Camera,
  speaker: Speaker,
  valve: Droplets,
};

export function DeviceIcon({ kind, size = 18 }: { kind: DeviceKind; size?: number }) {
  const Icon = ICONS[kind] ?? Activity;
  return <Icon size={size} />;
}
