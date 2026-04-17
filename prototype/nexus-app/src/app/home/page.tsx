"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Plus, Pencil, Check, RotateCcw, LayoutGrid } from "lucide-react";
import { useNexus, selectActivePersona } from "@/lib/store";
import {
  WidgetRenderer,
  WidgetFrame,
  AddWidgetModal,
  MomentsBar,
  MomentProgressOverlay,
} from "@/components/widgets";
import type { HomeWidget, WidgetSize } from "@/lib/types";
import { cn } from "@/lib/utils";

/* Grid column spans for each size. Base grid is 4 cols (mobile).
 * On md+ we expose more columns to allow richer layouts. */
const COL_SPAN: Record<WidgetSize, string> = {
  S: "col-span-2 md:col-span-2 xl:col-span-2",
  M: "col-span-4 md:col-span-4 xl:col-span-4",
  L: "col-span-4 md:col-span-6 xl:col-span-6",
  XL: "col-span-4 md:col-span-8 xl:col-span-8",
};

const ROW_SPAN: Record<WidgetSize, string> = {
  S: "row-span-1",
  M: "row-span-1",
  L: "row-span-2",
  XL: "row-span-2",
};

const GREETING = (hour: number) => {
  if (hour < 6) return "Buenas noches";
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

export default function HomePage() {
  const personaId = useNexus((s) => s.activePersonaId);
  const widgets = useNexus((s) => s.homeWidgets[personaId] ?? []);
  const initialized = useNexus((s) => s.homeCanvasInitialized.includes(personaId));
  const editMode = useNexus((s) => s.homeEditMode);
  const ownerName = useNexus(
    (s) => s.ownerProfile.aiContext.preferredName || s.ownerProfile.displayName,
  );

  const seedHomeCanvas = useNexus((s) => s.seedHomeCanvas);
  const toggleEdit = useNexus((s) => s.toggleHomeEditMode);
  const reorder = useNexus((s) => s.reorderHomeWidgets);
  const resize = useNexus((s) => s.resizeHomeWidget);
  const remove = useNexus((s) => s.removeHomeWidget);
  const reset = useNexus((s) => s.resetHomeCanvas);

  const persona = selectActivePersona(personaId);
  const [addOpen, setAddOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const currentMoment = useNexus((s) => s.currentMoment);

  const affectedIds = useMemo(
    () => new Set(currentMoment?.affectedDeviceIds ?? []),
    [currentMoment],
  );

  function isWidgetHighlighted(w: HomeWidget): boolean {
    if (!currentMoment) return false;
    switch (w.type) {
      case "camera":
      case "tv":
      case "climate":
        return affectedIds.has(w.deviceId);
      case "lightGroup":
        return w.deviceIds.some((id) => affectedIds.has(id));
      case "scene":
        return false;
    }
  }

  // Seed canvas on first visit per persona
  useEffect(() => {
    if (!initialized) seedHomeCanvas(personaId);
  }, [personaId, initialized, seedHomeCanvas]);

  // Mount-only clock (avoid SSR mismatch)
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const greeting = useMemo(
    () => (now ? GREETING(now.getHours()) : "Hola"),
    [now],
  );

  // Turn off edit mode when navigating away
  useEffect(() => {
    return () => {
      if (useNexus.getState().homeEditMode) {
        useNexus.setState({ homeEditMode: false });
      }
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="container-page pt-6 pb-24 md:pb-8">
        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="mb-6 flex items-start justify-between gap-4 flex-wrap"
        >
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-ink-soft uppercase tracking-wider">
              {persona.name}
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              {greeting}
              {ownerName ? `, ${ownerName.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {editMode
                ? "Arrastra, cambia tamaño o elimina tus widgets."
                : "Tu panel táctil — todo al alcance de un toque."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {editMode && (
              <motion.button
                type="button"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (confirm("¿Restablecer canvas a valores iniciales?")) {
                    reset(personaId);
                    seedHomeCanvas(personaId);
                  }
                }}
                className="h-11 px-3 rounded-xl bg-surface-2 border border-line text-xs font-medium flex items-center gap-1.5 hover:bg-line/40 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Restaurar</span>
              </motion.button>
            )}

            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={toggleEdit}
              className={cn(
                "h-11 px-4 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors shadow-soft",
                editMode
                  ? "bg-gold text-navy"
                  : "bg-surface-2 border border-line hover:bg-line/40",
              )}
            >
              {editMode ? (
                <>
                  <Check className="h-4 w-4" />
                  Listo
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  <span>Editar canvas</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.header>

        {/* Moments strip (multi-device flows) */}
        {!editMode && <MomentsBar personaId={personaId} />}

        {/* Grid */}
        {widgets.length === 0 ? (
          <EmptyCanvas onAdd={() => setAddOpen(true)} />
        ) : editMode ? (
          <Reorder.Group
            axis="y"
            values={widgets}
            onReorder={(ordered) =>
              reorder(personaId, (ordered as HomeWidget[]).map((w) => w.id))
            }
            className="grid grid-cols-4 md:grid-cols-8 xl:grid-cols-12 gap-3 sm:gap-4 auto-rows-[110px] sm:auto-rows-[130px]"
          >
            {widgets.map((w) => (
              <Reorder.Item
                key={w.id}
                value={w}
                className={cn(
                  COL_SPAN[w.size],
                  ROW_SPAN[w.size],
                  "touch-none",
                )}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              >
                <WidgetFrame
                  id={w.id}
                  size={w.size}
                  editMode
                  onRemove={() => remove(personaId, w.id)}
                  onResize={(s) => resize(personaId, w.id, s)}
                >
                  <WidgetRenderer widget={w} interactive={false} />
                </WidgetFrame>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-4 md:grid-cols-8 xl:grid-cols-12 gap-3 sm:gap-4 auto-rows-[110px] sm:auto-rows-[130px]"
          >
            <AnimatePresence mode="popLayout">
              {widgets.map((w) => (
                <motion.div
                  key={w.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className={cn(COL_SPAN[w.size], ROW_SPAN[w.size])}
                >
                  <WidgetFrame
                    id={w.id}
                    size={w.size}
                    editMode={false}
                    highlighted={isWidgetHighlighted(w)}
                  >
                    <WidgetRenderer widget={w} interactive />
                  </WidgetFrame>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* FAB: Add widget */}
      <AnimatePresence>
        {editMode && (
          <motion.button
            key="fab-add"
            type="button"
            initial={{ opacity: 0, scale: 0.5, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 40 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            onClick={() => setAddOpen(true)}
            className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-40 h-14 px-5 rounded-full bg-gold text-navy font-semibold shadow-2xl flex items-center gap-2 hover:shadow-[0_8px_28px_rgba(230,186,102,0.5)] transition-shadow"
          >
            <Plus className="h-5 w-5" />
            <span>Agregar widget</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AddWidgetModal
        open={addOpen}
        personaId={personaId}
        onClose={() => setAddOpen(false)}
      />

      {/* Multi-device moment orchestration progress */}
      <MomentProgressOverlay />
    </div>
  );
}

function EmptyCanvas({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border-2 border-dashed border-line bg-surface-2/50 p-8 sm:p-12 text-center"
    >
      <div className="mx-auto w-14 h-14 rounded-2xl bg-gold/20 text-gold-border flex items-center justify-center mb-4">
        <LayoutGrid className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold">Canvas vacío</h2>
      <p className="mt-1 text-sm text-ink-soft max-w-sm mx-auto">
        Agrega tus cámaras favoritas, grupos de luces, tu TV, escenas y clima
        para construir tu panel ideal.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 h-12 px-5 rounded-2xl bg-gold text-navy font-semibold inline-flex items-center gap-2 hover:shadow-soft transition"
      >
        <Plus className="h-4 w-4" />
        Agregar primer widget
      </button>
    </motion.div>
  );
}
