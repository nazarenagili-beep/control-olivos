import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { pageHead } from "@/lib/head";
import { useStore } from "@/lib/store";
import { diffDays, fmt, plazosPorFila } from "@/lib/logic";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PageHeader, Status } from "@/components/ov";

export const Route = createFileRoute("/plazos")({
  head: () => pageHead("Plazos de seguridad", "Estado de los plazos de seguridad por cuadro y fila antes de cosechar."),
  component: Plazos,
});

function Plazos() {
  const s = useStore();
  const todos = plazosPorFila(s.filas, s.aplicaciones, s.productos);
  return (
    <>
      <PageHeader title="Plazos de seguridad" subtitle="Cuándo se puede cosechar cada fila" />
      <div className="space-y-4">
        {s.cuadros.map((c) => {
          const ps = todos.filter((p) => p.fila.cuadro_id === c.id).sort((a, b) => a.fila.numero - b.fila.numero);
          const bloqueadas = ps.filter((p) => p.libre && p.libre > s.hoy);
          const max = bloqueadas.reduce<string | null>((m, p) => (!m || p.libre! > m ? p.libre : m), null);
          return (
            <Collapsible key={c.id} className="ov-card overflow-hidden" defaultOpen={bloqueadas.length > 0}>
              <CollapsibleTrigger className="flex w-full flex-wrap items-center gap-3 p-5 text-left">
                <h3 className="flex-1 text-2xl">{c.nombre}</h3>
                {bloqueadas.length ? (
                  <Status tone="danger">{bloqueadas.length} filas no cosechables · libre total {fmt(max)}</Status>
                ) : (
                  <Status tone="ok">Libre para cosechar</Status>
                )}
                <ChevronDown className="size-5" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-ov-beige-light text-left">
                      <tr><th className="p-3">Fila</th><th className="p-3">Último producto</th><th className="p-3">Aplicado</th><th className="p-3">Plazo</th><th className="p-3">Libre cosecha</th><th className="p-3">Estado</th></tr>
                    </thead>
                    <tbody>
                      {ps.map((p) => {
                        const falta = p.libre ? diffDays(p.libre, s.hoy) : 0;
                        return (
                          <tr key={p.fila.id} className="border-t border-border hover:bg-ov-beige-light/40">
                            <td className="p-3 text-foreground">Fila {p.fila.numero}</td>
                            <td className="p-3">{p.producto?.nombre_comercial ?? "—"}</td>
                            <td className="p-3">{fmt(p.aplicacion?.fecha)}</td>
                            <td className="p-3">{p.producto ? `${p.producto.plazo_seguridad_dias} días` : "—"}</td>
                            <td className="p-3">{fmt(p.libre)}</td>
                            <td className="p-3">{falta > 0 ? <Status tone="danger">Faltan {falta} días</Status> : <Status tone="ok">Libre</Status>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </>
  );
}
