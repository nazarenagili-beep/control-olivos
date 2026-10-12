import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { pageHead } from "@/lib/head";
import { useStore, type Cosecha } from "@/lib/store";
import { fmt, num } from "@/lib/logic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, PageHeader } from "@/components/ov";

export const Route = createFileRoute("/cosecha")({
  head: () => pageHead("Cosecha y rendimiento", "Kilos de aceituna cosechados, litros de aceite prensado y rendimiento por campaña."),
  component: CosechaPage,
});

const rend = (kg: number, l: number) => (kg > 0 ? (l / kg) * 100 : 0);

function CosechaPage() {
  const s = useStore();
  const vacio = (): Cosecha => ({ id: "", fecha: s.hoy, campania: s.hoy.slice(0, 4), hectareas: "", kilos: 0, litros: 0, notas: "" });
  const [f, setF] = useState<Cosecha>(vacio);
  if (!s.isAdmin) return <p className="p-6">Este apartado es solo para la administradora.</p>;

  const r = rend(f.kilos, f.litros);
  const guardar = () => {
    if (!(f.kilos > 0) || !(f.litros > 0)) return toast.error("Escribe los kilos y los litros.");
    s.saveCosecha(f);
    toast.success("Cosecha guardada.");
    setF(vacio());
  };

  const campanias = [...new Set(s.cosechas.map((c) => c.campania))].sort().reverse();

  return (
    <div className="space-y-6">
      <PageHeader title="Cosecha y rendimiento" subtitle="Kilos cosechados, aceite prensado y rendimiento" />

      <section className="rounded-lg border bg-card p-4 space-y-4">
        <h2 className="font-display text-xl">{f.id ? "Editar registro" : "Nuevo registro"}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Fecha"><Input type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} /></Field>
          <Field label="Campaña (año)"><Input value={f.campania} onChange={(e) => setF({ ...f, campania: e.target.value })} /></Field>
          <Field label="Hectáreas / filas (opcional)"><Input value={f.hectareas} placeholder="Ej: Ha 1 y 2" onChange={(e) => setF({ ...f, hectareas: e.target.value })} /></Field>
          <Field label="Kilos de aceituna"><Input type="number" inputMode="decimal" min={0} value={f.kilos || ""} onChange={(e) => setF({ ...f, kilos: Number(e.target.value) })} /></Field>
          <Field label="Litros de aceite"><Input type="number" inputMode="decimal" min={0} value={f.litros || ""} onChange={(e) => setF({ ...f, litros: Number(e.target.value) })} /></Field>
          <Field label="Notas"><Input value={f.notas} placeholder="Almazara, variedad…" onChange={(e) => setF({ ...f, notas: e.target.value })} /></Field>
        </div>
        <div className="rounded-md bg-muted p-3 text-sm">
          Rendimiento: <strong className="text-lg">{num(r, 2)} %</strong>
          {f.litros > 0 && <> · {num(f.kilos / f.litros, 2)} kg de aceituna por litro</>}
        </div>
        <div className="flex gap-2">
          <Button onClick={guardar}>Guardar</Button>
          {f.id && <Button variant="outline" onClick={() => setF(vacio())}>Cancelar</Button>}
        </div>
      </section>

      {campanias.map((c) => {
        const lista = s.cosechas.filter((x) => x.campania === c);
        const kg = lista.reduce((a, x) => a + x.kilos, 0);
        const l = lista.reduce((a, x) => a + x.litros, 0);
        return (
          <section key={c} className="space-y-3">
            <h2 className="font-display text-2xl">Campaña {c}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Kpi label="Kilos cosechados" value={`${num(kg, 0)} kg`} />
              <Kpi label="Litros de aceite" value={`${num(l, 1)} L`} />
              <Kpi label="Rendimiento medio" value={`${num(rend(kg, l), 2)} %`} />
            </div>
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground"><tr><th className="p-3">Fecha</th><th className="p-3">Zona</th><th className="p-3">Kilos</th><th className="p-3">Litros</th><th className="p-3">Rendimiento</th><th className="p-3">Notas</th><th /></tr></thead>
                <tbody>
                  {lista.map((x) => (
                    <tr key={x.id} className="cursor-pointer border-t hover:bg-muted/50" onClick={() => setF(x)}>
                      <td className="p-3">{fmt(x.fecha)}</td><td className="p-3">{x.hectareas || "—"}</td>
                      <td className="p-3">{num(x.kilos, 0)}</td><td className="p-3">{num(x.litros, 1)}</td>
                      <td className="p-3 font-semibold">{num(rend(x.kilos, x.litros), 2)} %</td><td className="p-3">{x.notas}</td>
                      <td className="p-3"><Button size="icon" variant="ghost" aria-label="Borrar" onClick={(e) => { e.stopPropagation(); if (confirm("¿Borrar este registro?")) s.deleteCosecha(x.id); }}><Trash2 className="size-4" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      {!campanias.length && <p className="text-muted-foreground">Todavía no hay cosechas anotadas.</p>}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-display text-3xl">{value}</div>
    </div>
  );
}
