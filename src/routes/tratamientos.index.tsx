import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Plus, Trash2, Wind, CloudRain } from "lucide-react";
import { toast } from "sonner";
import { pageHead } from "@/lib/head";
import { nombreCuadro, useStore } from "@/lib/store";
import { fmt, num } from "@/lib/logic";
import { UNIDAD_DOSIS_LABEL } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, SimpleSelect, filasTexto, zonaLabel } from "@/components/ov";

export const Route = createFileRoute("/tratamientos/")({
  head: () => pageHead("Tratamientos", "Registro de aplicaciones de productos en el olivar."),
  component: Tratamientos,
});

function Tratamientos() {
  const s = useStore();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [cuadro, setCuadro] = useState("todos");
  const [prod, setProd] = useState("todos");
  const lista = s.aplicaciones
    .filter((a) => (!desde || a.fecha >= desde) && (!hasta || a.fecha <= hasta) && (cuadro === "todos" || a.cuadro_id === cuadro) && (prod === "todos" || a.producto_id === prod))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const P = (id: string) => s.productos.find((p) => p.id === id);
  const U = (id: string) => s.usuarios.find((u) => u.id === id)?.nombre ?? "—";

  const exportar = () => {
    const rows = [["Fecha", "Producto", "Cuadro", "Filas", "Zona", "Litros caldo", "Dosis", "Cantidad", "Aplicado por", "Libre cosecha"]];
    lista.forEach((a) => rows.push([fmt(a.fecha), P(a.producto_id)?.nombre_comercial ?? "", nombreCuadro(s.cuadros, a.cuadro_id), filasTexto(s.filas, a.fila_ids), zonaLabel(a.zona), String(a.litros_caldo), `${a.dosis_usada} ${UNIDAD_DOSIS_LABEL[a.unidad_dosis]}`, `${a.cantidad_producto} ${P(a.producto_id)?.unidad_stock}`, U(a.aplicado_por), fmt(a.fecha_libre_cosecha)]));
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
    const el = document.createElement("a");
    el.href = url; el.download = "aplicaciones.csv"; el.click();
  };

  return (
    <>
      <PageHeader
        title="Tratamientos"
        subtitle="Aplicaciones registradas"
        actions={<>
          {s.isAdmin && <Button variant="outline" onClick={exportar}><Download /> Exportar CSV</Button>}
          <Button asChild><Link to="/tratamientos/nueva" search={{ tarea: undefined }}><Plus /> Nueva aplicación</Link></Button>
        </>}
      />
      <div className="ov-card mb-4 grid gap-2 p-3 sm:grid-cols-4">
        <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-11" aria-label="Desde" />
        <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-11" aria-label="Hasta" />
        <SimpleSelect value={cuadro} onChange={setCuadro} options={[{ value: "todos", label: "Todos los cuadros" }, ...s.cuadros.map((c) => ({ value: c.id, label: c.nombre }))]} />
        <SimpleSelect value={prod} onChange={setProd} options={[{ value: "todos", label: "Todos los productos" }, ...s.productos.map((p) => ({ value: p.id, label: p.nombre_comercial }))]} />
      </div>
      {lista.length === 0 ? (
        <p className="ov-card p-8 text-center text-sm text-muted-foreground">No hay aplicaciones con estos filtros.</p>
      ) : (
        <>
          <div className="ov-card hidden overflow-hidden md:block">
            <Table>
              <TableHeader className="bg-ov-beige-light">
                <TableRow><TableHead>Fecha</TableHead><TableHead>Producto</TableHead><TableHead>Dónde</TableHead><TableHead>Caldo</TableHead><TableHead>Cantidad</TableHead><TableHead>Por</TableHead><TableHead>Libre cosecha</TableHead><TableHead /></TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((a) => (
                  <TableRow key={a.id} className="hover:bg-ov-beige-light/50">
                    <TableCell>{fmt(a.fecha)}</TableCell>
                    <TableCell className="text-foreground">
                      {P(a.producto_id)?.nombre_comercial}
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {a.viento === "fuerte" && <span className="text-warn flex items-center gap-1"><Wind className="size-3" />Viento fuerte</span>}
                        {a.lluvia_prevista_24h && <span className="text-warn flex items-center gap-1"><CloudRain className="size-3" />Lluvia</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{nombreCuadro(s.cuadros, a.cuadro_id)}<br />{filasTexto(s.filas, a.fila_ids)} · {zonaLabel(a.zona)}</TableCell>
                    <TableCell>{num(a.litros_caldo)} L</TableCell>
                    <TableCell>{num(a.cantidad_producto, 3)} {P(a.producto_id)?.unidad_stock}</TableCell>
                    <TableCell>{U(a.aplicado_por)}</TableCell>
                    <TableCell>{fmt(a.fecha_libre_cosecha)}</TableCell>
                    <TableCell>
                      {s.isAdmin && (
                        <Button variant="ghost" size="icon" aria-label="Borrar" onClick={() => { if (confirm("¿Borrar esta aplicación? Se devolverá el stock.")) { s.deleteAplicacion(a.id); toast.success("Aplicación borrada"); } }}>
                          <Trash2 className="text-danger" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-2 md:hidden">
            {lista.map((a) => (
              <div key={a.id} className="ov-card p-4 text-sm">
                <div className="flex justify-between text-foreground"><span>{P(a.producto_id)?.nombre_comercial}</span><span>{fmt(a.fecha)}</span></div>
                <div className="text-xs text-muted-foreground">{nombreCuadro(s.cuadros, a.cuadro_id)} · {filasTexto(s.filas, a.fila_ids)} · {zonaLabel(a.zona)}</div>
                <div className="mt-1">{num(a.cantidad_producto, 3)} {P(a.producto_id)?.unidad_stock} en {num(a.litros_caldo)} L · libre {fmt(a.fecha_libre_cosecha)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
