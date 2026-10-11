import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead } from "@/lib/head";
import { useStore } from "@/lib/store";
import { num } from "@/lib/logic";
import { CATEGORIA_LABEL, UNIDAD_DOSIS_LABEL, type Categoria } from "@/lib/data";
import { PageHeader } from "@/components/ov";

export const Route = createFileRoute("/tratamientos/")({
  head: () => pageHead("Tratamientos", "Guía de productos del olivar: para qué sirve cada uno, dosis y precauciones."),
  component: Tratamientos,
});

const ORDEN: Categoria[] = ["fungicida", "insecticida", "herbicida", "fertilizante", "otro"];

function Tratamientos() {
  const s = useStore();
  const activos = s.productos.filter((p) => p.activo);
  return (
    <>
      <PageHeader title="Tratamientos" subtitle="Guía de productos: para qué sirve cada uno. El control de lo hecho se lleva en el calendario." />
      <p className="ov-card mb-6 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Días de espera:</strong> días que hay que esperar después de aplicar el producto antes de poder cosechar, para que la aceituna no tenga restos del producto.
      </p>
      {ORDEN.map((cat) => {
        const ps = activos.filter((p) => p.categoria === cat);
        if (!ps.length) return null;
        return (
          <section key={cat} className="mb-8">
            <h2 className="mb-3 font-display text-2xl text-foreground">{CATEGORIA_LABEL[cat]}s</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {ps.map((p) => (
                <Link key={p.id} to="/productos/$id" params={{ id: p.id }} className="ov-card block p-4 hover:bg-ov-beige-light/40">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-lg font-bold text-foreground">{p.nombre_comercial}</h3>
                    <span className="text-xs text-muted-foreground">{p.principio_activo}</span>
                  </div>
                  <p className="mt-1 text-sm"><span className="font-semibold">Para qué sirve:</span> {p.uso || "—"}</p>
                  <p className="mt-1 text-sm"><span className="font-semibold">Dosis:</span> {num(p.dosis_recomendada)} {UNIDAD_DOSIS_LABEL[p.unidad_dosis]}</p>
                  <p className="mt-1 text-sm"><span className="font-semibold">Días de espera antes de cosechar:</span> {p.plazo_seguridad_dias}</p>
                  {p.notas && <p className="mt-1 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Precauciones:</span> {p.notas}</p>}
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
