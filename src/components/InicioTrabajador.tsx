import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { addDays, fmt } from "@/lib/logic";
import { Button } from "@/components/ui/button";
import { PageHeader, seccionesTexto } from "@/components/ov";
import { AvanceTareas } from "@/components/AvanceTareas";
import { ParteDiario } from "@/components/ParteDiario";
import { AlertaPlazos } from "@/components/AlertaPlazos";

export function InicioTrabajador() {
  const s = useStore();
  const [parte, setParte] = useState(false);
  const desde = addDays(s.hoy, -7);
  const mios = s.registros
    .filter((r) => r.accion === "hecho" && r.usuario_id === s.user.id && r.fecha.slice(0, 10) >= desde)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <>
      <PageHeader title={`Hola${s.user.nombre ? `, ${s.user.nombre}` : ""}`} subtitle="Anota aquí el trabajo que hiciste" />
      <Button className="mb-6 h-16 w-full text-lg md:w-auto md:px-10" onClick={() => setParte(true)}>
        <Plus className="size-6" /> Anotar trabajo de hoy
      </Button>

      <div className="mb-6"><AlertaPlazos /></div>
      <section className="ov-card mb-6 p-4">
        <h2 className="mb-3 text-2xl">Lo que anotaste estos 7 días</h2>
        {mios.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no anotaste nada esta semana.</p>
        ) : (
          <ul className="divide-y divide-border">
            {mios.map((r) => (
              <li key={r.id} className="py-2">
                <div className="font-semibold text-foreground">{r.titulo}</div>
                <div className="text-sm text-muted-foreground">
                  {r.fecha.slice(0, 10) === s.hoy ? "Hoy" : fmt(r.fecha.slice(0, 10))} · {seccionesTexto(s.filas, r.secciones)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        
        <AvanceTareas />
      </section>
      {parte && <ParteDiario onClose={() => setParte(false)} />}
    </>
  );
}
