import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizRunner } from "@/components/quiz-runner";
import { TutorFab } from "@/components/tutor-fab";
import { Button } from "@/components/ui/button";
import { obtenerMateria } from "@/lib/db/queries";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MateriaPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await props.params;
  const materia = await obtenerMateria(id, session.user.id);
  if (!materia) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/" />}>
          ← Volver
        </Button>
        <h1 className="min-w-0 flex-1 truncate font-heading text-lg font-semibold">
          {materia.nombre}
        </h1>
      </div>

      <QuizRunner materia={materia} />
      <TutorFab materiaId={materia.id} />
    </main>
  );
}
