"use client";

import type { CSSProperties } from "react";
import type { Furniture3D } from "./room-themes";

/**
 * Renders a 3D cuboid (or approximated cylinder) made of 6 faces using CSS transforms.
 * Position is centered on (x, y, z) coordinates in the room's local axes.
 */
export function Box3D({
  piece, roomW, roomD,
}: {
  piece: Furniture3D;
  roomW: number;
  roomD: number;
}) {
  const { w, d, h, color, topColor = color, accent, shape = "box", label } = piece;
  // Position: room-local coords; center of cuboid
  const px = piece.x * roomW - roomW / 2;
  const pz = piece.z * roomD - roomD / 2;
  const pyBase = (piece.yOffset ?? 0);

  const halfW = w / 2, halfD = d / 2;
  // Shade each face slightly differently for depth perception (neuroscience: luminance → depth cue)
  const shade = (hex: string, amt: number) => {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + amt));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
    const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
    return `rgb(${r},${g},${b})`;
  };

  const frontCol = color;
  const backCol = shade(color, -15);
  const leftCol = shade(color, -25);
  const rightCol = shade(color, 10);
  const topCol = topColor;
  const bottomCol = shade(color, -40);

  const containerStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    // Y grows downward in Room3D world (floor at +H/2)
    transform: `translate3d(${px}px, ${-pyBase}px, ${pz}px)`,
    transformStyle: "preserve-3d",
    pointerEvents: "none",
  };

  const faceBase: CSSProperties = {
    position: "absolute",
    backfaceVisibility: "hidden",
    boxShadow: "inset 0 0 10px rgba(0,0,0,0.12)",
  };

  // For cylinder approximation: use border-radius 50% on all faces.
  const radius = shape === "cylinder" ? "50%" : "4px";

  return (
    <div style={containerStyle}>
      {/* top */}
      <div
        style={{
          ...faceBase,
          width: w, height: d,
          background: topCol,
          borderRadius: radius,
          transform: `translate3d(${-halfW}px, ${-h}px, ${-halfD}px) rotateX(90deg) translateZ(${-d / 2}px)`,
          boxShadow: accent ? `inset 0 0 14px ${accent}66, 0 0 18px ${accent}44` : "inset 0 0 10px rgba(0,0,0,0.12)",
        }}
      />
      {/* bottom */}
      <div
        style={{
          ...faceBase,
          width: w, height: d,
          background: bottomCol,
          borderRadius: radius,
          transform: `translate3d(${-halfW}px, 0px, ${-halfD}px) rotateX(-90deg) translateZ(${-d / 2}px)`,
        }}
      />
      {/* front (facing +z, towards viewer at default rot) */}
      <div
        style={{
          ...faceBase,
          width: w, height: h,
          background: frontCol,
          borderRadius: radius,
          transform: `translate3d(${-halfW}px, ${-h}px, ${halfD}px)`,
        }}
      />
      {/* back */}
      <div
        style={{
          ...faceBase,
          width: w, height: h,
          background: backCol,
          borderRadius: radius,
          transform: `translate3d(${-halfW}px, ${-h}px, ${-halfD}px) rotateY(180deg) translateZ(${-w}px)`,
        }}
      />
      {/* left */}
      <div
        style={{
          ...faceBase,
          width: d, height: h,
          background: leftCol,
          borderRadius: radius,
          transform: `translate3d(${-halfW}px, ${-h}px, ${-halfD}px) rotateY(-90deg)`,
        }}
      />
      {/* right */}
      <div
        style={{
          ...faceBase,
          width: d, height: h,
          background: rightCol,
          borderRadius: radius,
          transform: `translate3d(${halfW}px, ${-h}px, ${halfD}px) rotateY(90deg) translateZ(${-d}px)`,
        }}
      />
      {/* accent glow (for screens, fire, water, etc) */}
      {accent && (
        <div
          style={{
            ...faceBase,
            width: w, height: h,
            background: `radial-gradient(ellipse at center, ${accent}55 0%, transparent 70%)`,
            transform: `translate3d(${-halfW}px, ${-h}px, ${halfD + 1}px)`,
            boxShadow: `0 0 20px ${accent}88`,
            pointerEvents: "none",
          }}
        />
      )}
      {/* label (always faces camera via billboarding trick: counter-rotate is complex;
          we skip it and just render flat on the top face as fallback) */}
      {label && (
        <div
          style={{
            position: "absolute",
            top: -h - 14,
            left: -halfW,
            width: w,
            textAlign: "center",
            fontSize: 9,
            color: "rgba(0,0,0,0.55)",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            transform: `rotateX(90deg) translateZ(${halfD + 1}px)`,
            transformOrigin: "top center",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
