"use client";

import { useMemo } from "react";
import { STATIC } from "@/lib/store";
import type { HomeWidget } from "@/lib/types";
import { CameraWidget } from "./CameraWidget";
import { LightGroupWidget } from "./LightGroupWidget";
import { TVWidget } from "./TVWidget";
import { SceneWidget } from "./SceneWidget";
import { ClimateWidget } from "./ClimateWidget";
import { ZoneWidget } from "./ZoneWidget";
import { SecurityPanel } from "./SecurityPanel";

export { WidgetFrame } from "./WidgetFrame";
export { CameraWidget } from "./CameraWidget";
export { LightGroupWidget } from "./LightGroupWidget";
export { TVWidget } from "./TVWidget";
export { SceneWidget } from "./SceneWidget";
export { ClimateWidget } from "./ClimateWidget";
export { ZoneWidget } from "./ZoneWidget";
export { SecurityPanel } from "./SecurityPanel";
export { CameraSecurityBar } from "./CameraSecurityBar";
export { AddWidgetModal } from "./AddWidgetModal";
export { YouTubeFeed, LiveClock } from "./CameraFeed";
export { MomentsBar, MomentProgressOverlay } from "./MomentsBar";

/** Renders a widget by its discriminated type. */
export function WidgetRenderer({
  widget,
  interactive,
}: {
  widget: HomeWidget;
  interactive: boolean;
}) {
  const deviceId =
    widget.type === "camera" || widget.type === "tv" || widget.type === "climate"
      ? widget.deviceId
      : null;

  const device = useMemo(
    () => (deviceId ? STATIC.devices.find((d) => d.id === deviceId) ?? null : null),
    [deviceId],
  );

  switch (widget.type) {
    case "camera":
      if (!device) return <MissingWidget label="Cámara no disponible" />;
      return <CameraWidget device={device} interactive={interactive} />;
    case "lightGroup":
      return (
        <LightGroupWidget
          deviceIds={widget.deviceIds}
          name={widget.name}
          interactive={interactive}
        />
      );
    case "tv":
      if (!device) return <MissingWidget label="TV no disponible" />;
      return <TVWidget device={device} interactive={interactive} />;
    case "scene":
      return <SceneWidget sceneId={widget.sceneId} interactive={interactive} />;
    case "climate":
      if (!device) return <MissingWidget label="Clima no disponible" />;
      return <ClimateWidget device={device} interactive={interactive} />;
    case "zone":
      return (
        <ZoneWidget
          scope={widget.scope}
          targetId={widget.targetId}
          name={widget.name}
          interactive={interactive}
          size={widget.size}
        />
      );
    case "securityPanel":
      return <SecurityPanel interactive={interactive} size={widget.size} />;
    default:
      return <MissingWidget label="Widget desconocido" />;
  }
}

function MissingWidget({ label }: { label: string }) {
  return (
    <div className="h-full w-full rounded-2xl bg-surface-2 border border-dashed border-line flex items-center justify-center text-xs text-ink-soft">
      {label}
    </div>
  );
}
