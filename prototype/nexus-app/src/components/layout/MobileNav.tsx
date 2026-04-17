"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Home, Layers, Mic, GitBranch, ScrollText, Settings,
  MapPin, Activity, Plug, Sparkles, BarChart3, Bell,
  X, ChevronDown, Moon, Sun, Eye, EyeOff, RotateCcw,
} from "lucide-react";
import { useNexus, STATIC, selectActivePersona } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { PersonaId } from "@/lib/types";

const NAV = [
  { href: "/dashboard",    label: "Dashboard",     icon: Home },
  { href: "/rooms",        label: "Habitaciones",  icon: MapPin },
  { href: "/devices",      label: "Dispositivos",  icon: Plug },
  { href: "/scenes",       label: "Escenas",       icon: Sparkles },
  { href: "/voice",        label: "Voz e IA",      icon: Mic },
  { href: "/rules",        label: "Reglas",        icon: GitBranch },
  { href: "/alerts",       label: "Alertas",       icon: Bell },
  { href: "/health",       label: "Salud",         icon: Activity },
  { href: "/energy",       label: "Energía",       icon: BarChart3 },
  { href: "/audit",        label: "Auditoría",     icon: ScrollText },
  { href: "/integrations", label: "Integraciones", icon: Layers },
  { href: "/settings",     label: "Ajustes",       icon: Settings },
];

export function MobileNav() {
  const open = useNexus((s) => s.mobileNavOpen);
  const setOpen = useNexus((s) => s.setMobileNavOpen);
  const pathname = usePathname();
  const personaId = useNexus((s) => s.activePersonaId);
  const setPersona = useNexus((s) => s.setActivePersona);
  const presentation = useNexus((s) => s.presentationMode);
  const togglePresentation = useNexus((s) => s.togglePresentation);
  const reset = useNexus((s) => s.resetDemo);
  const { theme, setTheme } = useTheme();
  const persona = selectActivePersona(personaId);

  // Close on route change
  useEffect(() => {
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm md:hidden"
            aria-hidden
          />
          <motion.aside
            key="mobile-drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed left-0 top-0 bottom-0 z-[56] w-[84vw] max-w-[320px] bg-surface-2 border-r border-line flex flex-col md:hidden"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            {/* header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-line">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="font-display text-2xl text-navy dark:text-cream"
              >
                Nexus<span className="text-gold">.</span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-surface text-ink-soft"
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>

            {/* persona picker */}
            <div className="px-3 pt-3">
              <div className="text-[10px] uppercase tracking-widest text-ink-soft px-2 mb-1.5">Sitio</div>
              <div className="space-y-1">
                {STATIC.personas.map((p) => {
                  const active = p.id === personaId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPersona(p.id as PersonaId)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition",
                        active ? "bg-sage/15 border border-sage/30" : "hover:bg-surface border border-transparent",
                      )}
                    >
                      <span className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        active ? "bg-status-ok" : "bg-ink-soft/40",
                      )} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium truncate">{p.name}</span>
                        <span className="block text-[11px] text-ink-soft truncate">{p.location} · {p.type}</span>
                      </span>
                      {active && <ChevronDown size={14} className="text-sage rotate-[-90deg]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* nav */}
            <nav className="flex-1 overflow-y-auto py-3 px-2">
              <div className="text-[10px] uppercase tracking-widest text-ink-soft px-3 mb-1.5 mt-2">
                Menú · {persona.name}
              </div>
              <div className="space-y-0.5">
                {NAV.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                        active
                          ? "bg-navy text-cream"
                          : "text-ink hover:bg-surface",
                      )}
                    >
                      <Icon size={18} className={cn("flex-shrink-0", active ? "text-gold" : "text-ink-soft")} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* footer controls */}
            <div
              className="border-t border-line p-3 grid grid-cols-3 gap-2"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
            >
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex flex-col items-center gap-1 py-2 rounded-lg border border-line text-ink-soft hover:bg-surface text-[10px]"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                <span>{theme === "dark" ? "Claro" : "Oscuro"}</span>
              </button>
              <button
                onClick={togglePresentation}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] transition",
                  presentation
                    ? "bg-gold/20 text-gold-border border-gold/40"
                    : "border-line text-ink-soft hover:bg-surface",
                )}
              >
                {presentation ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>Presentar</span>
              </button>
              <button
                onClick={reset}
                className="flex flex-col items-center gap-1 py-2 rounded-lg border border-line text-ink-soft hover:bg-surface text-[10px]"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
