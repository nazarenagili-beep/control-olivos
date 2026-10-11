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
import { ESTADO_LABEL, TIPO_LABEL, type EstadoTarea, type Fila, type TipoTarea, type Zona } from "@/lib/data";
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

export function FilasPicker({
  filas,
  value,
  onChange,
}: {
  filas: Fila[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const todas = value.length === 0;
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={todas} onCheckedChange={() => onChange([])} />
        Todas las filas del cuadro
      </label>
      <div className="grid grid-cols-7 gap-1.5">
        {filas.map((f) => {
          const on = value.includes(f.id);
          return (
            <button
              type="button"
              key={f.id}
              onClick={() => onChange(on ? value.filter((x) => x !== f.id) : [...value, f.id])}
              className={cn(
                "h-9 rounded-md border text-sm transition-colors",
                on ? "border-ov-olive-light bg-ov-olive-light text-ov-white-broken" : "border-border bg-card hover:bg-ov-beige-light",
              )}
              aria-pressed={on}
            >
              {f.numero}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function filasTexto(filas: Fila[], ids: string[]) {
  if (!ids.length) return "Todas las filas";
  const nums = filas.filter((f) => ids.includes(f.id)).map((f) => f.numero).sort((a, b) => a - b);
  return `Filas ${nums.join(", ")}`;
}
