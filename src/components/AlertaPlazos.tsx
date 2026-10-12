import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { fmt, plazosPorFila } from "@/lib/logic";
import { haDeFila } from "@/components/ov";

/** Aviso de plazos de seguridad: filas donde todavía no se puede echar producto ni cosechar. */
export function AlertaPlazos({ numeros }: { numeros?: number[] }) {
  const s = useStore();
  const filas = s.filas.filter((f) => !numeros || numeros.includes(f.numero));
  const activos = plazosPorFila(filas, s.aplicaciones, s.productos)
    .filter((p) => p.libre && p.libre > s.hoy)
    .sort((a, b) => a.fila.numero - b.fila.numero);

  if (!activos.length) {
    if (numeros) return null;
    return (
      <div className="flex items-center gap-3 rounded-lg border-2 border-border bg-card p-4">
        <ShieldCheck className="size-6 shrink-0 text-primary" />
        <p className="text-foreground">Ninguna fila tiene plazo de seguridad. Se puede fertilizar y echar producto.</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border-2 border-danger-border bg-danger/10 p-4">
      <p className="mb-2 flex items-center gap-2 font-semibold text-danger">
        <ShieldAlert className="size-6 shrink-0" /> Atención: no echar producto ni fertilizar en estas filas
      </p>
      <ul className="space-y-1 text-sm text-foreground">
        {activos.map((p) => (
          <li key={p.fila.id}>
            Ha {haDeFila(p.fila.numero)} · Fila {p.fila.numero} — hasta el <strong>{fmt(p.libre)}</strong>
            {p.producto ? ` (${p.producto.nombre_comercial})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
