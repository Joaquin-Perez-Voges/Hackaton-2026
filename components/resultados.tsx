import type { Prueba } from "@/lib/db/schema";

function emojiFor(pct: number) {
  return pct === 100 ? "🎉" : pct >= 60 ? "👍" : "📚";
}

export function Resultados({ pruebas }: { pruebas: Prueba[] }) {
  // Solo pruebas ya corregidas, ordenadas de la más vieja a la más nueva.
  const realizadas = pruebas
    .filter((p) => p.correctas != null && p.total != null)
    .slice()
    .reverse();

  if (realizadas.length === 0) {
    return (
      <p className="rounded-xl bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
        Todavía no hiciste ninguna prueba.
      </p>
    );
  }

  const promedio = Math.round(
    realizadas.reduce((acc, p) => acc + (p.correctas! / p.total!) * 100, 0) /
      realizadas.length
  );

  return (
    <div className="space-y-2">
      {realizadas.map((p, i) => {
        const pct = Math.round((p.correctas! / p.total!) * 100);
        const fecha = new Date(p.createdAt).toLocaleDateString("es-AR");
        return (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
          >
            <span className="text-sm">
              {emojiFor(pct)} Prueba {i + 1} — {fecha}
            </span>
            <span className="font-mono text-sm font-medium">
              {p.correctas} de {p.total}
            </span>
          </div>
        );
      })}

      <div className="mt-3 rounded-xl bg-muted/50 px-4 py-3 text-center text-sm font-medium">
        {emojiFor(promedio)} Promedio de tus pruebas: {promedio}%
      </div>
    </div>
  );
}
