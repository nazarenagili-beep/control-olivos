import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { pageHead } from "@/lib/head";
import { nombreCuadro, useStore } from "@/lib/store";
import { ars, fmt, num } from "@/lib/logic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, PageHeader, SimpleSelect, Status } from "@/components/ov";

export const Route = createFileRoute("/stock")({
  head: () => pageHead("Stock", "Control de stock, compras, ajustes y gasto en productos."),
  component: Stock,
});

function Stock() {
  const s = useStore();
  const [modo, setModo] = useState<null | "compra" | "ajuste">(null);
  const [prod, setProd] = useState(s.productos[0]?.id ?? "");
  const [cant, setCant] = useState("");
  const [precio, setPrecio] = useState("");
  const [fecha, setFecha] = useState(s.hoy);
  const [nota, setNota] = useState("");
  if (!s.isAdmin) return <p className="ov-card p-8 text-center">Solo la administradora puede ver el stock.</p>;

  const guardar = () => {
    const c = Number(cant);
    if (!c) return toast.error("Indica una cantidad.");
    if (modo === "compra") {
      if (!(Number(precio) > 0)) return toast.error("Indica el precio total.");
      s.addCompra(prod, c, Number(precio), fecha, nota);
    } else {
      if (!nota.trim()) return toast.error("El motivo del ajuste es obligatorio.");
      s.addAjuste(prod, c, fecha, nota);
    }
    toast.success("Movimiento registrado");
    setModo(null); setCant(""); setPrecio(""); setNota("");
  };

  const gasto = new Map<string, number>();
  s.aplicaciones.forEach((a) => {
    const p = s.productos.find((x) => x.id === a.producto_id);
    if (!p) return;
    const k = `${a.fecha.slice(0, 7)}|${a.cuadro_id}`;
    gasto.set(k, (gasto.get(k) ?? 0) + a.cantidad_producto * p.precio_por_unidad);
  });
  const PN = (id: string) => s.productos.find((p) => p.id === id);

  return (
    <>
      <PageHeader title="Stock" actions={<><Button variant="outline" onClick={() => setModo("ajuste")}>Ajuste manual</Button><Button onClick={() => setModo("compra")}>Registrar compra</Button></>} />
      <div className="ov-card mb-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ov-beige-light text-left"><tr><th className="p-3">Producto</th><th className="p-3">Stock</th><th className="p-3">Mínimo</th><th className="p-3 w-48">Nivel</th><th className="p-3">Valor</th></tr></thead>
          <tbody>
            {s.productos.map((p) => {
              const pct = Math.max(0, Math.min(100, (p.stock_actual / Math.max(p.stock_minimo * 2, 0.001)) * 100));
              const bajo = p.stock_actual < p.stock_minimo;
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 text-foreground">{p.nombre_comercial}</td>
                  <td className="p-3">{bajo ? <Status tone="danger">{num(p.stock_actual, 3)} {p.unidad_stock}</Status> : `${num(p.stock_actual, 3)} ${p.unidad_stock}`}</td>
                  <td className="p-3">{num(p.stock_minimo)} {p.unidad_stock}</td>
                  <td className="p-3"><div className="h-2 rounded-full bg-ov-beige-light"><div className={bajo ? "h-2 rounded-full bg-danger" : "ov-gradient h-2 rounded-full"} style={{ width: `${pct}%` }} /></div></td>
                  <td className="p-3">{ars(Math.max(0, p.stock_actual) * p.precio_por_unidad)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="ov-card p-5">
          <h3 className="mb-2 text-xl">Movimientos</h3>
          <ul className="divide-y divide-border text-sm">
            {s.movimientos.slice(0, 15).map((m) => (
              <li key={m.id} className="flex justify-between gap-2 py-2">
                <span>{fmt(m.fecha)} · {PN(m.producto_id)?.nombre_comercial} · {m.tipo}{m.nota && ` · ${m.nota}`}</span>
                <span className={m.cantidad < 0 ? "text-danger" : "text-ok"}>{m.cantidad > 0 ? "+" : ""}{num(m.cantidad, 3)} {PN(m.producto_id)?.unidad_stock}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="ov-card p-5">
          <h3 className="mb-2 text-xl">Gasto por mes y cuadro</h3>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Mes</th><th>Cuadro</th><th className="text-right">Gasto</th></tr></thead>
            <tbody>
              {[...gasto.entries()].sort().reverse().map(([k, v]) => {
                const [mes, c] = k.split("|");
                return <tr key={k} className="border-t border-border"><td className="py-2">{mes.split("-").reverse().join("/")}</td><td>{nombreCuadro(s.cuadros, c)}</td><td className="text-right">{ars(v)}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog open={!!modo} onOpenChange={(o) => !o && setModo(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-2xl font-medium">{modo === "compra" ? "Registrar compra" : "Ajuste manual"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <Field label="Producto"><SimpleSelect value={prod} onChange={setProd} options={s.productos.map((p) => ({ value: p.id, label: `${p.nombre_comercial} (${p.unidad_stock})` }))} /></Field>
            <Field label={modo === "compra" ? "Cantidad" : "Cantidad (negativa para restar)"}><Input type="number" step="any" className="h-11" value={cant} onChange={(e) => setCant(e.target.value)} /></Field>
            {modo === "compra" && <Field label="Precio total (ARS)"><Input type="number" className="h-11" value={precio} onChange={(e) => setPrecio(e.target.value)} /></Field>}
            <Field label="Fecha"><Input type="date" className="h-11" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
            <Field label={modo === "compra" ? "Nota" : "Motivo (rotura, recuento, vencido…)"}><Input className="h-11" value={nota} onChange={(e) => setNota(e.target.value)} /></Field>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModo(null)}>Cancelar</Button><Button onClick={guardar}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
