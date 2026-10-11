import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  CircleDot,
  Droplets,
  FlaskConical,
  Hammer,
  Leaf,
  Scissors,
  Search,
  Sprout,
  Tag,
  Wheat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ESTADO_LABEL, FILAS_POR_HA, TIPO_LABEL, type EstadoTarea, type Fila, type TipoTarea, type Zona } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const TIPO_ICON: Record<TipoTarea, typeof Leaf> = {
  poda: Scissors,
  abonado: Sprout,
  tratamiento: FlaskConical,
  riego: Droplets,
  cosecha: Wheat,
  mantenimiento: Hammer,
  control: Search,
  otro: Tag,
};
export const TIPO_BG: Record<TipoTarea, string> = {
  poda: "bg-t-poda",
  abonado: "bg-t-abonado",
  tratamiento: "bg-t-tratamiento",
  riego: "bg-t-riego",
  cosecha: "bg-t-cosecha",
  mantenimiento: "bg-t-mantenimiento",
  control: "bg-t-control",
  otro: "bg-t-otro",
};
export const TIPO_TEXT: Record<TipoTarea, string> = {
  poda: "text-t-poda",
  abonado: "text-t-abonado",
  tratamiento: "text-t-cosecha",
  riego: "text-t-riego",
  cosecha: "text-t-cosecha",
  mantenimiento: "text-t-mantenimiento",
  control: "text-t-control",
  otro: "text-t-mantenimiento",
};

export function TipoChip({ tipo, className }: { tipo: TipoTarea; className?: string }) {
  const Icon = TIPO_ICON[tipo];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", TIPO_TEXT[tipo], className)}>
      <span className={cn("size-2.5 rounded-full", TIPO_BG[tipo])} />
      <Icon className="size-3.5" />
      {TIPO_LABEL[tipo]}
    </span>
  );
}

type Tone = "ok" | "danger" | "warn" | "pending";
const TONE: Record<Tone, string> = { ok: "status-ok", danger: "status-danger", warn: "status-warn", pending: "status-pending" };
const TONE_ICON: Record<Tone, typeof Leaf> = { ok: CheckCircle2, danger: AlertTriangle, warn: AlertTriangle, pending: Circle };

export function Status({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  const Icon = TONE_ICON[tone];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs", TONE[tone], className)}>
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}

export function EstadoBadge({ estado, atrasada }: { estado: EstadoTarea; atrasada?: boolean }) {
  if (atrasada) return <Status tone="danger">Atrasada</Status>;
  if (estado === "hecha") return <Status tone="ok">{ESTADO_LABEL[estado]}</Status>;
  if (estado === "en_curso")
    return (
      <span className="status-warn inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
        <CircleDot className="size-3.5" /> En curso
      </span>
    );
  return <Status tone="pending">Pendiente</Status>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm text-ov-stone">{label}</Label>
      {children}
      {hint}
    </div>
  );
}

export function SimpleSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: T | "";
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className={cn("h-11 bg-card", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export const ZONA_OPTS: { value: Zona; label: string }[] = [
  { value: "ambas", label: "Zonas A y B" },
  { value: "A", label: "Zona A (izquierda)" },
  { value: "B", label: "Zona B (derecha)" },
];
export const zonaLabel = (z: Zona) => (z === "ambas" ? "A y B" : `Zona ${z}`);

export const MITAD = 17;
export const haDeFila = (n: number) => Math.ceil(n / FILAS_POR_HA);
export const sec = (filaId: string, z: "A" | "B") => `${filaId}:${z}`;
export const seccionesDeFilas = (filas: Fila[]) => filas.flatMap((f) => [sec(f.id, "A"), sec(f.id, "B")]);
export const filasDeSecciones = (secs: string[]) => [...new Set(secs.map((x) => x.split(":")[0]))];

/**
 * Diagrama del cuadro: cada fila dibujada con sus 34 olivos, mitad A (izquierda) y mitad B (derecha).
 * modo "seleccion": elegir dónde se hace el trabajo (vacío = todo el cuadro).
 * modo "progreso": marcar qué mitades ya están hechas (solo dentro de `disponibles`).
 */
export function MapaFilas({
  filas,
  value,
  onChange,
  modo = "seleccion",
  disponibles,
  readOnly,
  onPick,
  seleccionada,
}: {
  filas: Fila[];
  value: string[];
  onChange?: (secs: string[]) => void;
  modo?: "seleccion" | "progreso";
  disponibles?: string[];
  readOnly?: boolean;
  onPick?: (k: string) => void;
  seleccionada?: string;
}) {
  const orden = [...filas].sort((a, b) => a.numero - b.numero);
  const todasSel = modo === "seleccion" && value.length === 0;
  const permitido = (k: string) => !disponibles || disponibles.length === 0 || disponibles.includes(k);
  const toggle = (k: string) => {
    if (onPick) return onPick(k);
    if (readOnly || !onChange || !permitido(k)) return;
    onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  };
  const setZona = (z: "A" | "B") => {
    const ks = orden.map((f) => sec(f.id, z)).filter(permitido);
    onChange?.([...new Set([...value.filter((x) => !x.endsWith(`:${z}`) || !ks.includes(x)), ...ks])]);
  };
  const total = orden.length * 2;
  const hechas = modo === "progreso" ? value.length : 0;
  const objetivo = modo === "progreso" ? (disponibles?.length ? disponibles.length : total) : 0;

  return (
    <div className="space-y-3">
      {!readOnly && !onPick && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {modo === "seleccion" ? (
            <label className="mr-2 flex items-center gap-2">
              <Checkbox checked={todasSel} onCheckedChange={() => onChange?.([])} /> Todo el cuadro
            </label>
          ) : (
            <span className="mr-2 text-foreground">
              Hecho {hechas} de {objetivo} mitades
            </span>
          )}
          <button type="button" onClick={() => setZona("A")} className="h-9 rounded-md border border-border bg-card px-3 hover:bg-ov-beige-light">Toda la zona A</button>
          <button type="button" onClick={() => setZona("B")} className="h-9 rounded-md border border-border bg-card px-3 hover:bg-ov-beige-light">Toda la zona B</button>
          {modo === "progreso" && (
            <button type="button" onClick={() => onChange?.((disponibles?.length ? disponibles : seccionesDeFilas(orden)).slice())} className="h-9 rounded-md border border-border bg-card px-3 hover:bg-ov-beige-light">Todo hecho</button>
          )}
          <button type="button" onClick={() => onChange?.([])} className="h-9 rounded-md px-3 text-ov-olive-light hover:underline">Limpiar</button>
        </div>
      )}
      <div className="rounded-lg border border-border bg-ov-white-broken/60 p-3">
        <div className="mb-2 grid grid-cols-[56px_1fr_1fr] gap-2 text-center text-xs uppercase tracking-wider text-muted-foreground">
          <span />
          <span>← Zona A (izquierda)</span>
          <span>Zona B (derecha) →</span>
        </div>
        <div className="max-h-96 space-y-1 overflow-y-auto pr-1">
          {orden.map((f) => (
            <div key={f.id}>
            {(f.numero - 1) % FILAS_POR_HA === 0 && (
              <div className="mb-1 mt-3 flex items-center gap-2 first:mt-0">
                <span className="font-display text-base font-medium text-foreground">Hectárea {haDeFila(f.numero)}</span>
                <span className="text-xs text-muted-foreground">filas {f.numero}–{f.numero + FILAS_POR_HA - 1}</span>
                <span className="h-px flex-1 bg-ov-gold/30" />
              </div>
            )}
            <div className="grid grid-cols-[56px_1fr_1fr] items-center gap-2">
              <span className="text-xs text-ov-stone">Fila {f.numero}</span>
              {(["A", "B"] as const).map((z) => {
                const k = sec(f.id, z);
                const on = modo === "seleccion" ? todasSel || value.includes(k) : value.includes(k);
                const off = !permitido(k);
                const cls =
                  modo === "progreso"
                    ? on
                      ? "status-ok"
                      : off
                        ? "border border-dashed border-border opacity-40"
                        : "status-pending"
                    : on
                      ? "border border-ov-olive-light bg-ov-olive-light/15"
                      : "border border-border bg-card";
                return (
                  <button
                    type="button"
                    key={z}
                    disabled={!onPick && (off || readOnly)}
                    onClick={() => toggle(k)}
                    aria-pressed={on}
                    aria-label={`Fila ${f.numero}, zona ${z}${on ? (modo === "progreso" ? ", hecha" : ", seleccionada") : ""}`}
                    className={cn("flex h-9 items-center justify-between gap-1 rounded-md px-2 transition-colors enabled:hover:ring-2 enabled:hover:ring-ov-gold/40", cls, seleccionada === k && "ring-2 ring-ov-gold")}
                  >
                    <span className="text-xs font-medium">{z}</span>
                    <span className="flex flex-1 justify-evenly">
                      {Array.from({ length: MITAD }).map((_, i) => (
                        <span key={i} className={cn("size-1.5 rounded-full", on ? "bg-ov-olive-light" : "bg-ov-stone/30")} />
                      ))}
                    </span>
                    {modo === "progreso" && on && <CheckCircle2 className="size-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function seccionesTexto(filas: Fila[], secs: string[]) {
  if (!secs.length) return "Todo el cuadro";
  const porFila = new Map<number, string[]>();
  secs.forEach((k) => {
    const [fid, z] = k.split(":");
    const f = filas.find((x) => x.id === fid);
    if (f) porFila.set(f.numero, [...(porFila.get(f.numero) ?? []), z]);
  });
  return [...porFila.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([n, zs]) => `Ha${haDeFila(n)} F${n} ${zs.length === 2 ? "A+B" : zs[0]}`)
    .join(", ");
}
