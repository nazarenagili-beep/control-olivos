import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { pageHead } from "@/lib/head";
import { useStore } from "@/lib/store";
import { ars, num } from "@/lib/logic";
import { CATEGORIA_LABEL, UNIDAD_DOSIS_LABEL, type Categoria, type Producto } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, SimpleSelect, Status } from "@/components/ov";
import { ProductoDialog, productoVacio } from "@/components/ProductoDialog";

export const Route = createFileRoute("/productos/")({
  head: () => pageHead("Productos", "Productos fitosanitarios y fertilizantes con fichas técnicas y plazos de seguridad."),
  component: Productos,
});

function Productos() {
  const s = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("todas");
  const [edit, setEdit] = useState<Producto | null>(null);
  const lista = s.productos.filter(
    (p) => (cat === "todas" || p.categoria === cat) && `${p.nombre_comercial} ${p.principio_activo}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <PageHeader title="Productos" actions={s.isAdmin && <Button onClick={() => setEdit(productoVacio)}><Plus /> Nuevo producto</Button>} />
      <div className="ov-card mb-4 grid gap-2 p-3 sm:grid-cols-[1fr_220px]">
        <Input placeholder="Buscar por nombre o principio activo" value={q} onChange={(e) => setQ(e.target.value)} className="h-11" />
        <SimpleSelect value={cat} onChange={setCat} options={[{ value: "todas", label: "Todas las categorías" }, ...(Object.keys(CATEGORIA_LABEL) as Categoria[]).map((k) => ({ value: k, label: CATEGORIA_LABEL[k] }))]} />
      </div>
      {s.productos.length === 0 ? (
        <p className="ov-card p-8 text-center text-sm text-muted-foreground">Todavía no hay productos. Crea el primero.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((p) => {
            const bajo = p.stock_actual < p.stock_minimo;
            return (
              <Link key={p.id} to="/productos/$id" params={{ id: p.id }} className="ov-card block p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xl">{p.nombre_comercial}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{CATEGORIA_LABEL[p.categoria]}</span>
                </div>
                <p className="text-sm text-muted-foreground">{p.principio_activo}</p>
                <dl className="mt-3 grid grid-cols-2 gap-1 text-sm">
                  <dt className="text-muted-foreground">Dosis</dt><dd>{num(p.dosis_recomendada)} {UNIDAD_DOSIS_LABEL[p.unidad_dosis]}</dd>
                  <dt className="text-muted-foreground">Plazo seguridad</dt><dd>{p.plazo_seguridad_dias} días</dd>
                  <dt className="text-muted-foreground">Stock</dt>
                  <dd>{bajo ? <Status tone="danger">{num(p.stock_actual, 3)} {p.unidad_stock}</Status> : `${num(p.stock_actual, 3)} ${p.unidad_stock}`}</dd>
                  {s.isAdmin && (<><dt className="text-muted-foreground">Precio</dt><dd>{ars(p.precio_por_unidad)}/{p.unidad_stock}</dd></>)}
                </dl>
                {!p.activo && <p className="mt-2 text-xs text-muted-foreground">Inactivo</p>}
              </Link>
            );
          })}
        </div>
      )}
      {edit && <ProductoDialog producto={edit} onClose={() => setEdit(null)} />}
    </>
  );
}
