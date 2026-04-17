"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetSize } from "@/lib/types";

const SIZES: WidgetSize[] = ["S", "M", "L", "XL"];

/* ── Frame wrapping every widget to layer edit controls ───── */

export function WidgetFrame({
  id,
  size,
  editMode,
  highlighted = false,
  onRemove,
  onResize,
  dragHandleProps,
  children,
  className,
}: {
  id: string;
  size: WidgetSize;
  editMode: boolean;
  highlighted?: boolean;
  onRemove?: () => void;
  onResize?: (size: WidgetSize) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      layout
      className={cn(
        "relative h-full w-full rounded-2xl overflow-hidden group",
        editMode && "ring-2 ring-gold/40 ring-offset-2 ring-offset-[var(--surface)]",
        highlighted && !editMode && "ring-2 ring-gold ring-offset-2 ring-offset-[var(--surface)]",
        className,
      )}
      animate={
        editMode
          ? { scale: [1, 1.01, 1] }
          : highlighted
            ? {
                scale: [1, 1.015, 1],
                boxShadow: [
                  "0 0 0 0 rgba(230,186,102,0)",
                  "0 0 32px 4px rgba(230,186,102,0.45)",
                  "0 0 0 0 rgba(230,186,102,0)",
                ],
              }
            : { scale: 1 }
      }
      transition={
        editMode
          ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
          : highlighted
            ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
            : { type: "spring", stiffness: 420, damping: 32 }
      }
    >
      {/* Widget content */}
      <div
        className={cn(
          "h-full w-full transition-opacity",
          editMode && "pointer-events-none",
        )}
        aria-hidden={editMode}
      >
        {children}
      </div>

      {/* Edit mode overlay */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-30 pointer-events-none"
          >
            {/* Drag handle (top-left) */}
            <div
              {...dragHandleProps}
              className="absolute top-2 left-2 w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-navy/90 text-cream flex items-center justify-center shadow-elev pointer-events-auto cursor-grab active:cursor-grabbing touch-none"
              aria-label="Mover widget"
            >
              <GripVertical className="h-4 w-4" />
            </div>

            {/* Delete (top-right) */}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="absolute top-2 right-2 w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-status-critical text-white flex items-center justify-center shadow-elev pointer-events-auto hover:opacity-90"
                aria-label="Eliminar widget"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Size chips (bottom) */}
            {onResize && (
              <div
                id={`widget-resize-${id}`}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-xl bg-navy/90 shadow-elev pointer-events-auto backdrop-blur"
              >
                {SIZES.map((s) => {
                  const active = s === size;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onResize(s)}
                      className={cn(
                        "w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-[11px] font-bold tabular-nums transition-colors flex items-center justify-center",
                        active
                          ? "bg-gold text-navy"
                          : "text-cream/70 hover:bg-white/10",
                      )}
                      aria-label={`Tamaño ${s}`}
                      aria-pressed={active}
                    >
                      {active && <Check className="h-3 w-3 mr-0.5" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
