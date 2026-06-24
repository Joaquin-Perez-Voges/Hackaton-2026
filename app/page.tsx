import { CheckIcon, FlameIcon, GraduationCapIcon } from "lucide-react";
import type { ReactNode } from "react";
import { MateriaCard } from "@/components/materia-card";
import { NuevaMateria } from "@/components/nueva-materia";
import { listarMaterias } from "@/lib/db/queries";
import { calcularRacha } from "@/lib/streak";

export const dynamic = "force-dynamic";

function Stat({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-1.5 text-2xl font-bold">
        {icon}
        {value}
      </div>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export default async function Home() {
  let materias: Awaited<ReturnType<typeof listarMaterias>> = [];
  let dbError = false;
  try {
    materias = await listarMaterias();
  } catch {
    dbError = true;
  }

  const completadas = materias.flatMap((m) =>
    m.pruebas.filter((p) => p.correctas != null)
  );
  const racha = calcularRacha(completadas.map((p) => p.createdAt));
  const aciertos = completadas.reduce((a, p) => a + (p.correctas ?? 0), 0);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10 md:py-14">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          ¡Hola! 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seguí tu racha y practicá con IA.
        </p>
      </header>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <Stat
          icon={<FlameIcon className="size-6 text-orange-500" />}
          value={racha}
          label={racha === 1 ? "día" : "días"}
        />
        <Stat
          icon={<CheckIcon className="size-6 text-primary" />}
          value={aciertos}
          label="aciertos"
        />
        <Stat
          icon={<GraduationCapIcon className="size-6 text-muted-foreground" />}
          value={completadas.length}
          label="pruebas"
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Tus materias
      </h2>

      {dbError && (
        <p className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          No se pudo conectar a la base de datos. Revisá <code>POSTGRES_URL</code>.
        </p>
      )}

      {materias.length === 0 ? (
        <p className="rounded-xl bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
          Todavía no hay materias. ¡Creá una!
        </p>
      ) : (
        <ul className="grid gap-2.5">
          {materias.map((m) => (
            <MateriaCard
              key={m.id}
              id={m.id}
              nombre={m.nombre}
              cantPreguntas={m.pruebas[0]?.preguntas.length ?? 0}
              cantPruebas={m.pruebas.length}
            />
          ))}
        </ul>
      )}

      <NuevaMateria />
    </div>
  );
}
