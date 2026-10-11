import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { pageHead } from "@/lib/head";
import { useStore } from "@/lib/store";
import { addDays, cantidadBase, fmt, num } from "@/lib/logic";
import type { Aplicacion, UnidadDosis } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Field, MapaFilas, PageHeader, SimpleSelect, filasDeSecciones } from "@/components/ov";
import { DosisInputs, LitrosInput, ResultadoDosis } from "@/components/Calculadora";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/tratamientos/nueva")({
  validateSearch: (s: Record<string, unknown>) => ({ tarea: typeof s.tarea === "string" ? s.tarea : undefined }),
  head: () => pageHead("Nueva aplicación", "Registrar un tratamiento con cálculo de dosis y descuento de stock."),
  component: Nueva,
});

function Nueva() {
  const s = useStore();
  const navigate = useNavigate();
  const { tarea: tareaId } = Route.useSearch();
  const tarea = s.tareas.find((t) => t.id === tareaId);
  const activos = s.productos.filter((p) => p.activo);
  const [fecha, setFecha] = useState(s.hoy);
  const [cuadro, setCuadro] = useState(tarea?.cuadro_id ?? s.cuadros[0].id);
  const [secciones, setSecciones] = useState<string[]>(tarea?.secciones ?? []);
  const [prodId, setProdId] = useState(activos[0]?.id ?? "");
  const prod = s.productos.find((p) => p.id === prodId);
  const [litros, setLitros] = useState(16);
  const [dosis, setDosis] = useState(prod?.dosis_recomendada ?? 0);
  const [unidad, setUnidad] = useState<UnidadDosis>(prod?.unidad_dosis ?? "ml_por_100L");
  const [por, setPor] = useState(s.user.id);
  const [temp, setTemp] = useState("");
  const [viento, setViento] = useState<Aplicacion["viento"]>("calmo");
  const [lluvia, setLluvia] = useState(false);
  const [tareaVinc, setTareaVinc] = useState(tarea?.id ?? "none");
  const [notas, setNotas] = useState("");
  const [avisos, setAvisos] = useState<string[] | null>(null);

  const cantidad = cantidadBase(dosis, unidad, litros) / 1000;
  const elegirProducto = (id: string) => {
    setProdId(id);
    const p = s.productos.find((x) => x.id === id);
    if (p) { setDosis(p.dosis_recomendada); setUnidad(p.unidad_dosis); }
  };
  const tareasTrat = s.tareas.filter((t) => t.tipo === "tratamiento" && t.estado !== "hecha");

  const intentarGuardar = () => {
    if (!prod) return toast.error("Elige un producto.");
    if (!(litros > 0) || !(dosis > 0)) return toast.error("Litros y dosis deben ser mayores que 0.");
    const a: string[] = [];
    if (viento === "fuerte" || lluvia) a.push("Con viento fuerte o lluvia prevista el tratamiento puede perder eficacia. ¿Guardar igualmente?");
    if (prod.stock_actual < cantidad) a.push(`Solo quedan ${num(prod.stock_actual, 3)} ${prod.unidad_stock} de este producto. La aplicación necesita ${num(cantidad, 3)}.`);
    if (a.length) setAvisos(a);
    else guardar();
  };
  const guardar = () => {
    const r = s.addAplicacion({
      fecha, producto_id: prodId, cuadro_id: cuadro, fila_ids: filasDeSecciones(secciones), secciones, litros_caldo: litros, dosis_usada: dosis, unidad_dosis: unidad,
      cantidad_producto: cantidad, aplicado_por: por, tarea_id: tareaVinc === "none" ? null : tareaVinc, temperatura_c: temp ? Number(temp) : null,
      viento, lluvia_prevista_24h: lluvia, notas,
    });
    toast.success(`Aplicación guardada. Libre para cosechar el ${fmt(r.fecha_libre_cosecha)}.`);
    navigate({ to: "/tratamientos" });
  };

  return (
    <>
      <PageHeader title="Nueva aplicación" subtitle={tarea ? `Vinculada a: ${tarea.titulo}` : "Registro de tratamiento"} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="ov-card grid gap-4 p-6 sm:grid-cols-2">
          <Field label="Fecha"><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-11" /></Field>
          <Field label="Aplicado por">
            <SimpleSelect value={por} onChange={setPor} options={s.usuarios.filter((u) => u.activo).map((u) => ({ value: u.id, label: u.nombre }))} />
          </Field>
          <Field label="Cuadro">
            <SimpleSelect value={cuadro} onChange={(v) => { setCuadro(v); setSecciones([]); }} options={s.cuadros.map((c) => ({ value: c.id, label: c.nombre }))} />
          </Field>
          <Field label="¿Dónde se aplica? Toca la mitad de cada fila (A izquierda, B derecha)" className="sm:col-span-2">
            <MapaFilas filas={s.filas.filter((f) => f.cuadro_id === cuadro)} value={secciones} onChange={setSecciones} />
          </Field>
          <Field label="Producto" className="sm:col-span-2">
            <SimpleSelect value={prodId} onChange={elegirProducto} options={activos.map((p) => ({ value: p.id, label: `${p.nombre_comercial} · plazo ${p.plazo_seguridad_dias} días` }))} />
          </Field>
          <Field label="Litros de caldo"><LitrosInput litros={litros} onChange={setLitros} /></Field>
          <DosisInputs dosis={dosis} unidad={unidad} onDosis={setDosis} onUnidad={setUnidad} />
          <Field label="Temperatura (°C)"><Input type="number" value={temp} onChange={(e) => setTemp(e.target.value)} className="h-11" /></Field>
          <Field label="Viento">
            <SimpleSelect value={viento} onChange={setViento} options={[{ value: "calmo", label: "Calmo" }, { value: "moderado", label: "Moderado" }, { value: "fuerte", label: "Fuerte" }]} />
          </Field>
          <label className="flex min-h-11 items-center gap-3 text-sm"><Switch checked={lluvia} onCheckedChange={setLluvia} /> Lluvia prevista en 24 h</label>
          <Field label="Tarea vinculada">
            <SimpleSelect value={tareaVinc} onChange={setTareaVinc} options={[{ value: "none", label: "Ninguna" }, ...tareasTrat.map((t) => ({ value: t.id, label: `${t.titulo} (${fmt(t.fecha_inicio)})` }))]} />
          </Field>
          <Field label="Notas" className="sm:col-span-2"><Textarea value={notas} onChange={(e) => setNotas(e.target.value)} /></Field>
        </div>
        <aside className="space-y-4">
          <div className="ov-card p-5">
            <h3 className="mb-3 text-xl">Cantidad a preparar</h3>
            <ResultadoDosis dosis={dosis} unidad={unidad} litros={litros} producto={prod} />
            {prod && (
              <div className="mt-4 space-y-1 text-sm">
                <p>Stock: <span className={prod.stock_actual < cantidad ? "text-danger" : ""}>{num(prod.stock_actual, 3)} {prod.unidad_stock}</span></p>
                <p>Libre para cosechar: <strong className="text-foreground">{fmt(addDays(fecha, prod.plazo_seguridad_dias))}</strong></p>
              </div>
            )}
          </div>
          {(viento === "fuerte" || lluvia) && (
            <p className="status-warn flex gap-2 rounded-lg p-3 text-sm"><AlertTriangle className="size-4 shrink-0" /> Viento fuerte o lluvia prevista: puede perder eficacia.</p>
          )}
          <Button className="w-full" size="lg" onClick={intentarGuardar}>Guardar aplicación</Button>
        </aside>
      </div>
      <AlertDialog open={!!avisos} onOpenChange={(o) => !o && setAvisos(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl font-medium">Antes de guardar</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {avisos?.map((a) => <p key={a} className="status-warn rounded-md p-2">{a}</p>)}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar</AlertDialogCancel>
            <AlertDialogAction onClick={guardar}>Guardar igualmente</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
