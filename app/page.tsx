import { MateriaCard } from "@/components/materia-card";
import { NuevaMateria } from "@/components/nueva-materia";
import { listarMaterias } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  let materias: Awaited<ReturnType<typeof listarMaterias>> = [];
  let dbError = false;
  try {
    materias = await listarMaterias();
  } catch {
    dbError = true;
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <header className="mb-8">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          NextSelf
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estudiá con IA para superarte cada día.
        </p>
      </header>

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
    </main>
  );
}
