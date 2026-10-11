import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/head";
import { useStore } from "@/lib/store";
import { fmt } from "@/lib/logic";
import { PageHeader } from "@/components/ov";
import { CampoMapa } from "@/components/CampoMapa";

export const Route = createFileRoute("/")({
  head: () => pageHead("Inicio", "Mapa del campo con el trabajo hecho en cada fila en los últimos 30 días."),
  component: Inicio,
});

function Inicio() {
  const s = useStore();
  return (
    <>
      <PageHeader title={`Buen día, ${s.user.nombre.split(" ")[0]}`} subtitle={`Hoy es ${fmt(s.hoy)} · Villa Iris`} />
      <CampoMapa />
    </>
  );
}
