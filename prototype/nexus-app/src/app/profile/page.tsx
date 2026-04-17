"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNexus, selectDevicesByPersona, selectRoomsByPersona, STATIC } from "@/lib/store";
import type { OwnerProfile } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  User, MapPin, Mail, Phone, Home, Brain, MessageSquare,
  Save, CheckCircle2, Sparkles, Globe, Clock, Heart, BookOpen,
  Shield, Zap, Camera, Lightbulb, Thermometer, ChevronDown,
  Pencil, Info, AlertTriangle, Users,
} from "lucide-react";

/* ── Animated save indicator ──────────────────────────────── */

function SaveToast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-cream shadow-elev border border-white/10 text-sm"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
          >
            <CheckCircle2 className="h-4 w-4 text-sage" />
          </motion.div>
          Cambios guardados
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Stat card ────────────────────────────────────────────── */

function StatCard({
  Icon,
  label,
  value,
  color,
  delay,
}: {
  Icon: typeof Home;
  label: string;
  value: number | string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}18`, color }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-ink-soft leading-tight">{label}</p>
            <p className="text-lg font-display tabular-nums leading-tight">{value}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ── Input field ──────────────────────────────────────────── */

function Field({
  label,
  hint,
  value,
  onChange,
  multiline,
  placeholder,
  icon: FieldIcon,
  maxLength,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  icon?: typeof User;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium flex items-center gap-1.5">
        {FieldIcon && <FieldIcon className="h-3.5 w-3.5 text-ink-soft" />}
        {label}
      </label>
      {hint && <p className="text-[11px] text-ink-soft -mt-0.5">{hint}</p>}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-line text-sm resize-none focus:outline-none focus:border-gold-border/50 transition placeholder:text-ink-soft/40"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-line text-sm focus:outline-none focus:border-gold-border/50 transition placeholder:text-ink-soft/40"
        />
      )}
      {maxLength && value.length > maxLength * 0.8 && (
        <p className="text-[10px] text-ink-soft text-right tabular-nums">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

/* ── Communication style selector ─────────────────────────── */

const COMM_STYLES: Array<{
  value: OwnerProfile["aiContext"]["communicationStyle"];
  label: string;
  desc: string;
  emoji: string;
}> = [
  { value: "casual", label: "Casual", desc: "Respuestas amigables y relajadas", emoji: "😊" },
  { value: "formal", label: "Formal", desc: "Tono profesional y respetuoso", emoji: "👔" },
  { value: "technical", label: "Técnico", desc: "Detalles precisos, jerga técnica", emoji: "🔧" },
];

/* ── Emoji picker (simple) ────────────────────────────────── */

const AVATAR_EMOJIS = ["🏠", "🏡", "🌴", "🌊", "🏔️", "🌿", "☀️", "🌙", "🔥", "💎", "🎯", "🦁", "🐺", "🦊", "🐼", "👤", "👨‍💻", "👩‍💻", "🧑‍🔧", "🧙‍♂️"];

/* ── AI Preview Panel ─────────────────────────────────────── */

function AIContextPreview({ profile }: { profile: OwnerProfile }) {
  const { aiContext } = profile;
  const hasContext = [
    aiContext.preferredName,
    aiContext.lifestyle,
    aiContext.schedule,
    aiContext.preferences,
    aiContext.specialNotes,
  ].some((v) => v.trim());

  if (!hasContext) return null;

  const preview = [
    aiContext.preferredName && `Me llamo ${aiContext.preferredName}.`,
    aiContext.lifestyle && `Estilo de vida: ${aiContext.lifestyle}.`,
    aiContext.schedule && `Horario: ${aiContext.schedule}.`,
    aiContext.preferences && `Preferencias: ${aiContext.preferences}.`,
    aiContext.specialNotes && `Notas: ${aiContext.specialNotes}.`,
    `Responde en tono ${COMM_STYLES.find((s) => s.value === aiContext.communicationStyle)?.label.toLowerCase() ?? "casual"}.`,
    `Idioma: ${aiContext.language === "es" ? "Español" : aiContext.language === "en" ? "English" : aiContext.language}.`,
  ].filter(Boolean).join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-gold-border/20 bg-gold/[0.03]">
        <CardHeader className="pb-2 border-none">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gold/15 flex items-center justify-center">
              <Brain className="h-3.5 w-3.5 text-gold-border" />
            </div>
            Vista previa — Contexto IA
          </CardTitle>
        </CardHeader>
        <CardBody className="pt-0">
          <p className="text-xs text-ink-soft leading-relaxed italic">
            &ldquo;{preview}&rdquo;
          </p>
          <p className="text-[10px] text-ink-soft/60 mt-2 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Esto es lo que la IA &ldquo;sabe&rdquo; de ti al responder
          </p>
        </CardBody>
      </Card>
    </motion.div>
  );
}

/* ── Section collapse ─────────────────────────────────────── */

function Section({
  title,
  icon: SIcon,
  color,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string;
  icon: typeof User;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center gap-3 hover:bg-surface/30 transition"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <SIcon className="h-4.5 w-4.5" />
        </div>
        <div className="text-left flex-1">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            {title}
            {badge && (
              <Badge tone="gold" className="text-[9px]">{badge}</Badge>
            )}
          </h3>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-ink-soft" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 space-y-4 border-t border-line">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function ProfilePage() {
  const personaId = useNexus((s) => s.activePersonaId);
  const profile = useNexus((s) => s.ownerProfile);
  const updateProfile = useNexus((s) => s.updateOwnerProfile);
  const updateAI = useNexus((s) => s.updateAIContext);

  const persona = useMemo(
    () => STATIC.personas.find((p) => p.id === personaId)!,
    [personaId],
  );
  const owner = useMemo(
    () => STATIC.users.find((u) => u.id === persona.primaryUserId),
    [persona],
  );
  const devices = selectDevicesByPersona(personaId);
  const rooms = selectRoomsByPersona(personaId);

  const stats = useMemo(() => ({
    rooms: rooms.length,
    devices: devices.length,
    cameras: devices.filter((d) => d.kind === "camera").length,
    lights: devices.filter((d) => d.kind === "light").length,
    online: devices.filter((d) => d.availability === "online").length,
  }), [rooms, devices]);

  /* Display name fallback */
  const displayName = profile.displayName || owner?.name || "Propietario";
  const initials = profile.displayName
    ? profile.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : owner?.initials ?? "??";

  /* Save feedback */
  const [showSaved, setShowSaved] = useState(false);
  const flash = useCallback(() => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, []);

  /* Debounced auto-save */
  const handleProfile = useCallback(
    (patch: Partial<OwnerProfile>) => { updateProfile(patch); flash(); },
    [updateProfile, flash],
  );
  const handleAI = useCallback(
    (patch: Partial<OwnerProfile["aiContext"]>) => { updateAI(patch); flash(); },
    [updateAI, flash],
  );

  /* Emoji picker state */
  const [emojiOpen, setEmojiOpen] = useState(false);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-3xl">
      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-navy/5 via-surface-2 to-gold/5 dark:from-navy/20 dark:to-gold/10"
      >
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar */}
          <div className="relative group">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEmojiOpen(!emojiOpen)}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-navy to-navy/80 dark:from-gold/30 dark:to-gold/10 flex items-center justify-center text-3xl sm:text-4xl shadow-elev border border-white/10 relative"
            >
              {profile.avatarEmoji || initials}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface-2 border border-line flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Pencil className="h-3 w-3 text-ink-soft" />
              </div>
            </motion.button>

            {/* Emoji picker dropdown */}
            <AnimatePresence>
              {emojiOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 z-20 bg-surface-2 border border-line rounded-xl shadow-elev p-2 grid grid-cols-5 gap-1 w-max max-w-[min(280px,90vw)]"
                >
                  {AVATAR_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => { handleProfile({ avatarEmoji: e }); setEmojiOpen(false); }}
                      className={cn(
                        "w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-lg hover:bg-surface transition",
                        profile.avatarEmoji === e && "bg-gold/15 ring-1 ring-gold-border",
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Name + meta */}
          <div className="text-center sm:text-left flex-1">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-display text-2xl sm:text-3xl"
            >
              {displayName}
            </motion.h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2 text-sm text-ink-soft">
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" />
                {owner?.role === "owner" ? "Propietario" : owner?.role ?? "—"}
              </span>
              <span className="text-line">·</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {persona.location}
              </span>
              <span className="text-line">·</span>
              <span className="flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                {persona.name}
              </span>
            </div>
            {persona.goals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 justify-center sm:justify-start">
                {persona.goals.map((g) => (
                  <Badge key={g} tone="sage" className="text-[10px]">{g}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <StatCard Icon={Home} label="Habitaciones" value={stats.rooms} color="#7B93DB" delay={0} />
        <StatCard Icon={Zap} label="Dispositivos" value={stats.devices} color="#5BB37F" delay={0.05} />
        <StatCard Icon={Camera} label="Cámaras" value={stats.cameras} color="#D9534F" delay={0.1} />
        <StatCard Icon={Lightbulb} label="Luces" value={stats.lights} color="#E0A537" delay={0.15} />
        <StatCard Icon={Zap} label="En línea" value={`${stats.online}/${stats.devices}`} color="#5BB37F" delay={0.2} />
      </div>

      {/* ── Personal info ── */}
      <Section title="Información personal" icon={User} color="#7B93DB">
        <Field
          label="Nombre completo"
          icon={User}
          value={profile.displayName}
          onChange={(v) => handleProfile({ displayName: v })}
          placeholder={owner?.name ?? "Tu nombre"}
          maxLength={80}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Email"
            icon={Mail}
            value={profile.email}
            onChange={(v) => handleProfile({ email: v })}
            placeholder="correo@ejemplo.com"
            maxLength={120}
          />
          <Field
            label="Teléfono"
            icon={Phone}
            value={profile.phone}
            onChange={(v) => handleProfile({ phone: v })}
            placeholder="+506 8888-8888"
            maxLength={20}
          />
        </div>
        <Field
          label="Biografía"
          icon={BookOpen}
          value={profile.bio}
          onChange={(v) => handleProfile({ bio: v })}
          placeholder="Cuéntanos sobre ti…"
          multiline
          maxLength={300}
        />
      </Section>

      {/* ── AI Context ── */}
      <Section title="Contexto para la IA" icon={Brain} color="#E0A537" badge="Gemini">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-gold/5 border border-gold-border/20 text-xs text-ink-soft">
          <Sparkles className="h-4 w-4 text-gold-border shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-ink">Personaliza cómo la IA interactúa contigo</p>
            <p className="mt-0.5">Esta información se incluye como contexto cuando la IA genera respuestas, sugiere escenas, analiza eventos y más.</p>
          </div>
        </div>

        <Field
          label="¿Cómo quieres que te llame?"
          icon={Heart}
          value={profile.aiContext.preferredName}
          onChange={(v) => handleAI({ preferredName: v })}
          placeholder="Ej: María, Don Carlos, Jefe…"
          hint="La IA usará este nombre al dirigirse a ti"
          maxLength={40}
        />

        <Field
          label="Estilo de vida"
          icon={Users}
          value={profile.aiContext.lifestyle}
          onChange={(v) => handleAI({ lifestyle: v })}
          placeholder="Ej: Familia con 2 niños, trabajo remoto, mascotas…"
          hint="Ayuda a la IA a personalizar sugerencias de escenas y automatizaciones"
          multiline
          maxLength={300}
        />

        <Field
          label="Horario típico"
          icon={Clock}
          value={profile.aiContext.schedule}
          onChange={(v) => handleAI({ schedule: v })}
          placeholder="Ej: Despierto 6am, gym 7am, trabajo 9-18, cena 19:30, dormir 22:30"
          hint="La IA entenderá cuándo encender luces, ajustar clima, activar seguridad"
          multiline
          maxLength={300}
        />

        <Field
          label="Preferencias del hogar"
          icon={Thermometer}
          value={profile.aiContext.preferences}
          onChange={(v) => handleAI({ preferences: v })}
          placeholder="Ej: Luz cálida 2700K, temperatura 22-24°C, música jazz al cocinar"
          hint="Contexto sobre tus preferencias de iluminación, clima, ambientes"
          multiline
          maxLength={400}
        />

        <Field
          label="Notas especiales"
          icon={AlertTriangle}
          value={profile.aiContext.specialNotes}
          onChange={(v) => handleAI({ specialNotes: v })}
          placeholder="Ej: Abuela vive en planta baja, zona sísmica, llueve mucho en octubre"
          hint="Cualquier dato relevante que la IA deba considerar"
          multiline
          maxLength={400}
        />

        {/* Communication style */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-ink-soft" />
            Estilo de comunicación
          </label>
          <p className="text-[11px] text-ink-soft">Cómo quieres que la IA se comunique contigo</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {COMM_STYLES.map((style) => {
              const active = profile.aiContext.communicationStyle === style.value;
              return (
                <motion.button
                  key={style.value}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAI({ communicationStyle: style.value })}
                  className={cn(
                    "relative p-3 rounded-xl border text-left transition-all",
                    active
                      ? "border-gold-border/50 bg-gold/5 shadow-soft"
                      : "border-line bg-surface hover:bg-surface-2",
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="comm-style-ring"
                      className="absolute inset-0 rounded-xl border-2 border-gold-border/40"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{style.emoji}</span>
                      {style.label}
                      {active && <CheckCircle2 className="h-3.5 w-3.5 text-gold-border ml-auto" />}
                    </div>
                    <p className="text-[11px] text-ink-soft mt-1">{style.desc}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Language */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-ink-soft" />
            Idioma de respuestas
          </label>
          <select
            value={profile.aiContext.language}
            onChange={(e) => handleAI({ language: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-line text-sm focus:outline-none focus:border-gold-border/50 transition"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </Section>

      {/* ── AI Context Preview ── */}
      <AIContextPreview profile={profile} />

      {/* ── Property info (read-only) ── */}
      <Section title="Propiedad activa" icon={Home} color="#5BB37F" defaultOpen={false}>
        <div className="space-y-3">
          {[
            { label: "Nombre", value: persona.name },
            { label: "Tipo", value: persona.type === "residential" ? "Residencial" : persona.type === "office" ? "Oficina" : "Agrícola" },
            { label: "Ubicación", value: persona.location },
            { label: "Propietario", value: owner?.name ?? "—" },
            { label: "ID", value: persona.id },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">{row.label}</span>
              <span className="font-medium">{row.value}</span>
            </div>
          ))}

          {persona.goals.length > 0 && (
            <div>
              <p className="text-sm text-ink-soft mb-1.5">Objetivos</p>
              <div className="flex flex-wrap gap-1.5">
                {persona.goals.map((g) => (
                  <Badge key={g} tone="sage" className="text-[10px]">{g}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── Save toast ── */}
      <SaveToast visible={showSaved} />
    </div>
  );
}
