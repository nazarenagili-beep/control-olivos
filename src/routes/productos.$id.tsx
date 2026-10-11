import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileText, Pencil } from "lucide-react";
import { toast } from "sonner";
import { pageHead } from "@/lib/head";
import { nombreCuadro, useStore } from "@/lib/store";
import { ars, fmt, num } from "@/lib/logic";
import { CATEGORIA_LABEL, UNIDAD_DOSIS_LABEL } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { PageHeader, Status, seccionesTexto } from "@/components/ov";
import { ProductoDialog } from "@/components/ProductoDialog";

export const Route = createFileRoute("/productos/$id")({
  head: () => pageHead("Ficha de producto", "Detalle del producto, aplicaciones y movimientos de stock."),
  component: Ficha,
});

function Ficha() {
  const { id } = Route.useParams();
  const s = useStore();
  const [edit, setEdit] = useState(false);
  const p = s.productos.find((x) => x.id === id);
  if (!p) return <p>Producto no encontrado.</p>;
  const apps = s.aplicaciones.filter((a) => a.producto_id === id);
  const movs = s.movimientos.filter((m) => m.producto_id === id);
  const bajo = p.stock_actual < p.stock_minimo;
  return (
    <>
      <Link to="/productos" className="mb-2 inline-flex items-center gap-1 text-sm text-ov-olive-light hover:underline"><ArrowLeft className="size-4" /> Productos</Link>
      <PageHeader
        title={p.nombre_comercial}
        subtitle={`${p.principio_activo} · ${CATEGORIA_LABEL[p.categoria]}`}
        actions={<>
          <Button variant="outline" onClick={() => toast(p.ficha_tecnica_nombre ? `Abriendo ${p.ficha_tecnica_nombre}…` : "Este producto no tiene ficha técnica.")}><FileText /> Ver ficha técnica</Button>
          {s.isAdmin && <Button onClick={() => setEdit(true)}><Pencil /> Editar</Button>}
        </>}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="ov-card space-y-2 p-5 text-sm">
          <h3 className="text-xl">Datos</h3>
          <p>{p.uso}</p>
          <p>Dosis recomendada: <strong>{num(p.dosis_recomendada)} {UNIDAD_DOSIS_LABEL[p.unidad_dosis]}</strong></p>
          <p>Plazo de seguridad: <strong>{p.plazo_seguridad_dias} días</strong></p>
          <p>Stock: {bajo ? <Status tone="danger">{num(p.stock_actual, 3)} {p.unidad_stock} (mín. {num(p.stock_minimo)})</Status> : <strong>{num(p.stock_actual, 3)} {p.unidad_stock}</strong>}</p>
          {s.isAdmin && <p>Precio: <strong>{ars(p.precio_por_unidad)}/{p.unidad_stock}</strong></p>}
        </div>
        <div className="ov-card p-5 lg:col-span-2">
          <h3 className="mb-2 text-xl">Aplicaciones</h3>
          {apps.length === 0 ? <p className="text-sm text-muted-foreground">Sin aplicaciones.</p> : (
            <ul className="divide-y divide-border text-sm">
              {apps.map((a) => (
                <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <span>{fmt(a.fecha)} · {nombreCuadro(s.cuadros, a.cuadro_id)} · {seccionesTexto(s.filas, a.secciones)}</span>
                  <span>{num(a.cantidad_producto, 3)} {p.unidad_stock}</span>
                </li>
              ))}
            </ul>
          )}
          {s.isAdmin && (
            <>
              <h3 className="mb-2 mt-6 text-xl">Movimientos de stock</h3>
              <ul className="divide-y divide-border text-sm">
                {movs.map((m) => (
                  <li key={m.id} className="flex justify-between py-2">
                    <span>{fmt(m.fecha)} · {m.tipo} {m.nota && `· ${m.nota}`}</span>
                    <span className={m.cantidad < 0 ? "text-danger" : "text-ok"}>{m.cantidad > 0 ? "+" : ""}{num(m.cantidad, 3)} {p.unidad_stock}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
      {edit && <ProductoDialog producto={p} onClose={() => setEdit(false)} />}
    </>
  );
}
