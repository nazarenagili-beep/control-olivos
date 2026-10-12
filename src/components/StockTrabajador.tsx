import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { fmt } from "@/lib/logic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ov";
import { cn } from "@/lib/utils";

export function StockTrabajador() {
  const s = useStore();
  const [notas, setNotas] = useState<Record<string, string>>({});
  const prods = [...s.productos].filter((p) => p.activo !== false).sort((a, b) => a.nombre_comercial.localeCompare(b.nombre_comercial));

  const avisar = (id: string) => {
    const p = s.productos.find((x) => x.id === id)!;
    s.saveProducto({ ...p, falta: { fecha: s.hoy, por: s.user.id, nota: (notas[id] ?? "").trim().slice(0, 200) } });
    toast.success(`Avisado: falta ${p.nombre_comercial}`);
  };

  return (
    <>
      <PageHeader title="Stock" subtitle="Avisa si un producto se está acabando o falta" />
      <div className="space-y-2">
        {prods.map((p) => (
          <div key={p.id} className={cn("ov-card flex flex-wrap items-center gap-3 p-4", p.falta && "border-danger-border")}>
            <div className="min-w-40 flex-1">
              <div className="font-semibold text-foreground">{p.nombre_comercial}</div>
              {p.falta && <div className="text-sm text-danger">Avisado que falta · {fmt(p.falta.fecha)}</div>}
            </div>
            {p.falta ? (
              <Button variant="outline" onClick={() => s.saveProducto({ ...p, falta: null })}>Quitar aviso</Button>
            ) : (
              <>
                <Input placeholder="Nota (opcional)" value={notas[p.id] ?? ""} maxLength={200} onChange={(e) => setNotas({ ...notas, [p.id]: e.target.value })} className="h-11 w-full md:w-56" />
                <Button className="h-11" onClick={() => avisar(p.id)}>Falta</Button>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
