"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Home, Layers, Mic, GitBranch, ScrollText, Settings,
  MapPin, Activity, Plug, Sparkles, BarChart3, Bell, Camera, UserCircle,
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
  { href: "/cameras",      label: "Cámaras",       icon: Camera },
  { href: "/audit",        label: "Auditoría",     icon: ScrollText },
  { href: "/integrations", label: "Integraciones", icon: Layers },
  { href: "/profile",      label: "Perfil",        icon: UserCircle },
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
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[55] bg-navy/70 backdrop-blur-[6px] md:hidden"
            aria-hidden
          />
          <motion.aside
            key="mobile-drawer"
            initial={{ x: "-104%" }}
            animate={{ x: 0 }}
            exit={{ x: "-104%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36, mass: 0.9 }}
            className="mobile-drawer fixed left-0 top-0 bottom-0 z-[56] w-[84vw] max-w-[320px] bg-surface-2 border-r border-line flex flex-col md:hidden overflow-hidden"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            {/* Gradiente decorativo de cabecera */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 right-0 h-40 opacity-70"
              style={{
                background:
                  "radial-gradient(120% 80% at 0% 0%, rgba(212,168,75,0.18) 0%, transparent 60%), radial-gradient(120% 80% at 100% 0%, rgba(168,192,144,0.14) 0%, transparent 60%)",
              }}
            />

            {/* header */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.3 }}
              className="relative h-16 flex items-center justify-between px-4 border-b border-line"
            >
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="font-display text-2xl text-navy dark:text-cream tracking-tight"
              >
                Nexus<span className="text-gold">.</span>
              </Link>
              <motion.button
                whileTap={{ scale: 0.9, rotate: 90 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-surface text-ink-soft"
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </motion.button>
            </motion.div>

            {/* persona picker */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.3 }}
              className="relative px-3 pt-3"
            >
              <div className="text-[10px] uppercase tracking-[0.18em] text-ink-soft px-2 mb-1.5">Sitio</div>
              <div className="space-y-1">
                {STATIC.personas.map((p) => {
                  const active = p.id === personaId;
                  return (
                    <motion.button
                      key={p.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPersona(p.id as PersonaId)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors duration-200",
                        active
                          ? "bg-sage/15 border border-sage/30 shadow-soft"
                          : "hover:bg-surface border border-transparent",
                      )}
                    >
                      <span className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0 transition-all",
                        active ? "bg-status-ok shadow-[0_0_0_3px_rgba(91,179,127,0.2)]" : "bg-ink-soft/40",
                      )} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium truncate">{p.name}</span>
                        <span className="block text-[11px] text-ink-soft truncate">{p.location} · {p.type}</span>
                      </span>
                      {active && <ChevronDown size={14} className="text-sage rotate-[-90deg]" />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* nav */}
            <nav className="relative flex-1 overflow-y-auto py-3 px-2">
              <div className="text-[10px] uppercase tracking-[0.18em] text-ink-soft px-3 mb-1.5 mt-2">
                Menú · {persona.name}
              </div>
              <motion.div
                className="space-y-0.5"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.025, delayChildren: 0.12 } },
                }}
              >
                {NAV.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.href}
                      variants={{
                        hidden: { opacity: 0, x: -12 },
                        show:   { opacity: 1, x: 0, transition: { type: "spring", stiffness: 420, damping: 32 } },
                      }}
                    >
                      <motion.div whileTap={{ scale: 0.97 }}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm overflow-hidden",
                            "transition-colors duration-200",
                            active ? "text-cream" : "text-ink hover:bg-surface",
                          )}
                        >
                          {active && (
                            <motion.span
                              layoutId="mobile-nav-active"
                              className="absolute inset-0 rounded-lg bg-navy shadow-soft"
                              transition={{ type: "spring", stiffness: 500, damping: 38 }}
                            />
                          )}
                          <Icon
                            size={18}
                            className={cn(
                              "relative z-10 flex-shrink-0 transition-colors",
                              active ? "text-gold" : "text-ink-soft",
                            )}
                          />
                          <span className="relative z-10 flex-1">{item.label}</span>
                          {active && (
                            <motion.span
                              aria-hidden
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="relative z-10 w-1 h-1 rounded-full bg-gold"
                            />
                          )}
                        </Link>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </nav>

            {/* footer controls */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.3 }}
              className="relative border-t border-line p-3 grid grid-cols-3 gap-2"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
            >
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex flex-col items-center gap-1 py-2 rounded-lg border border-line text-ink-soft hover:bg-surface hover:text-ink text-[10px] transition-colors"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                <span>{theme === "dark" ? "Claro" : "Oscuro"}</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={togglePresentation}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] transition-colors",
                  presentation
                    ? "bg-gold/20 text-gold-border border-gold/40"
                    : "border-line text-ink-soft hover:bg-surface hover:text-ink",
                )}
              >
                {presentation ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>Presentar</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.94, rotate: -90 }}
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                onClick={reset}
                className="flex flex-col items-center gap-1 py-2 rounded-lg border border-line text-ink-soft hover:bg-surface hover:text-ink text-[10px] transition-colors"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </motion.button>
            </motion.div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
