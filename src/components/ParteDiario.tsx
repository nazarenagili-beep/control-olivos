import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SimpleSelect, haDeFila } from "@/components/ov";
import { cn } from "@/lib/utils";

type Zona = "A" | "B" | "AB";

export function ParteDiario({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [fecha, setFecha] = useState(s.hoy);
  const [tareaId, setTareaId] = useState("");
  const [ha, setHa] = useState<number | null>(null);
  const [nums, setNums] = useState<number[]>([]);
  const [zona, setZona] = useState<Zona>("AB");

  // Labores que aplican en la fecha elegida (una por título)
  const opciones = useMemo(() => {
    const vigentes = s.tareas.filter((t) => t.fecha_inicio <= fecha && t.fecha_fin >= fecha);
    const vistos = new Set<string>();
    return vigentes.filter((t) => (vistos.has(t.titulo) ? false : (vistos.add(t.titulo), true))).sort((a, b) => a.titulo.localeCompare(b.titulo));
  }, [s.tareas, fecha]);
  const tarea = opciones.find((t) => t.id === tareaId) ?? null;

  const filasTarea = useMemo(() => {
    if (!tarea) return [];
    const ids = tarea.fila_ids.length ? tarea.fila_ids : s.filas.filter((f) => !tarea.cuadro_id || f.cuadro_id === tarea.cuadro_id).map((f) => f.id);
    return s.filas.filter((f) => ids.includes(f.id)).sort((a, b) => a.numero - b.numero);
  }, [tarea, s.filas]);
  const hectareas = [...new Set(filasTarea.map((f) => haDeFila(f.numero)))];
  const filasHa = filasTarea.filter((f) => haDeFila(f.numero) === ha);

  const elegirTarea = (id: string) => { setTareaId(id); setHa(null); setNums([]); };
  const toggle = (n: number) => setNums((x) => (x.includes(n) ? x.filter((y) => y !== n) : [...x, n]));
  const todas = filasHa.length > 0 && filasHa.every((f) => nums.includes(f.numero));

  const guardar = () => {
    if (!tarea || !nums.length) return;
    const zs = zona === "AB" ? ["A", "B"] : [zona];
    const nuevas = filasTarea.filter((f) => nums.includes(f.numero)).flatMap((f) => zs.map((z) => `${f.id}:${z}`));
    const secs = [...new Set([...tarea.secciones_hechas, ...nuevas])];
    s.setSeccionesHechas(tarea.id, secs, fecha);
    toast.success("Trabajo guardado");
    onClose();
  };

  const Big = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} className={cn("min-h-12 rounded-lg border-2 px-3 text-base font-semibold transition", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted")}>
      {children}
    </button>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle className="text-2xl">Anotar trabajo</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <section className="space-y-1.5">
            <label className="text-sm font-semibold">1. Fecha</label>
            <Input type="date" value={fecha} max={s.hoy} onChange={(e) => { setFecha(e.target.value); elegirTarea(""); }} className="h-12 text-base" />
          </section>
          <section className="space-y-1.5">
            <label className="text-sm font-semibold">2. Tarea</label>
            <SimpleSelect value={tareaId} onChange={elegirTarea} options={[{ value: "", label: "Elegir tarea…" }, ...opciones.map((t) => ({ value: t.id, label: t.titulo }))]} className="h-12" />
            {opciones.length === 0 && <p className="text-xs text-muted-foreground">No hay tareas previstas para esa fecha.</p>}
          </section>
          {tarea && (
            <section className="space-y-1.5">
              <label className="text-sm font-semibold">3. Hectárea</label>
              <div className="grid grid-cols-5 gap-2">
                {hectareas.map((h) => <Big key={h} on={ha === h} onClick={() => { setHa(h); setNums([]); }}>Ha {h}</Big>)}
              </div>
            </section>
          )}
          {ha !== null && (
            <section className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">4. Filas</label>
                <Button type="button" variant="outline" size="sm" onClick={() => setNums(todas ? [] : filasHa.map((f) => f.numero))}>{todas ? "Quitar todas" : "Hectárea completa"}</Button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {filasHa.map((f) => <Big key={f.id} on={nums.includes(f.numero)} onClick={() => toggle(f.numero)}>{f.numero}</Big>)}
              </div>
            </section>
          )}
          {nums.length > 0 && (
            <section className="space-y-1.5">
              <label className="text-sm font-semibold">5. Zona</label>
              <div className="grid grid-cols-3 gap-2">
                <Big on={zona === "A"} onClick={() => setZona("A")}>Zona A</Big>
                <Big on={zona === "B"} onClick={() => setZona("B")}>Zona B</Big>
                <Big on={zona === "AB"} onClick={() => setZona("AB")}>Ambas</Big>
              </div>
            </section>
          )}
          <Button className="h-14 w-full text-lg" disabled={!tarea || !nums.length} onClick={guardar}>Guardar trabajo</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
