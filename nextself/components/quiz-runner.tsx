"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { generarNuevaPrueba, guardarResultado } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { MateriaConPruebas, Prueba } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function QuizRunner({ materia }: { materia: MateriaConPruebas }) {
  // Prueba inicial: la más nueva que todavía no se respondió.
  const pruebaInicial = useMemo(
    () => materia.pruebas.find((p) => p.correctas == null) ?? null,
    [materia.pruebas]
  );

  const [prueba, setPrueba] = useState<Prueba | null>(pruebaInicial);
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [corregida, setCorregida] = useState(false);
  const [resultado, setResultado] = useState<{
    correctas: number;
    total: number;
  } | null>(null);
  const [generando, startGen] = useTransition();
  const [, startSave] = useTransition();

  function nuevaPrueba() {
    startGen(async () => {
      const res = await generarNuevaPrueba(materia.id);
      if (res.ok) {
        setPrueba(res.prueba);
        setRespuestas({});
        setCorregida(false);
        setResultado(null);
      } else {
        toast.error(res.error);
      }
    });
  }

  function corregir() {
    if (!prueba) return;
    let correctas = 0;
    prueba.preguntas.forEach((q, i) => {
      if (respuestas[i] === q.correcta) correctas++;
    });
    const total = prueba.preguntas.length;
    setResultado({ correctas, total });
    setCorregida(true);
    const pruebaId = prueba.id;
    startSave(async () => {
      await guardarResultado(materia.id, pruebaId, correctas, total);
    });
  }

  if (!prueba) {
    return (
      <div className="rounded-xl bg-muted/40 px-4 py-10 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          No hay una prueba pendiente. Generá una nueva para practicar.
        </p>
        <Button onClick={nuevaPrueba} disabled={generando}>
          {generando ? "Generando…" : "Generar prueba"}
        </Button>
      </div>
    );
  }

  const pct = resultado
    ? Math.round((resultado.correctas / resultado.total) * 100)
    : 0;
  const emoji = pct === 100 ? "🎉" : pct >= 60 ? "👍" : "📚";

  return (
    <div className="space-y-4">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {prueba.preguntas.length} preguntas
      </p>

      {prueba.preguntas.map((q, i) => (
        <div
          key={i}
          className="rounded-xl bg-card p-5 ring-1 ring-foreground/10"
        >
          <p className="mb-3 font-medium">
            {i + 1}. {q.pregunta}
          </p>
          <RadioGroup
            value={respuestas[i] != null ? String(respuestas[i]) : null}
            onValueChange={(v) =>
              setRespuestas((r) => ({ ...r, [i]: Number(v) }))
            }
            disabled={corregida}
          >
            {q.opciones.map((op, oi) => {
              const esCorrecta = corregida && oi === q.correcta;
              const esElegidaMal =
                corregida && respuestas[i] === oi && oi !== q.correcta;
              return (
                <label
                  key={oi}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm transition",
                    !corregida && "hover:bg-muted/50",
                    esCorrecta &&
                      "border-green-600/50 bg-green-50 text-green-800",
                    esElegidaMal && "border-red-600/50 bg-red-50 text-red-800"
                  )}
                >
                  <RadioGroupItem value={String(oi)} />
                  <span>{op}</span>
                </label>
              );
            })}
          </RadioGroup>
        </div>
      ))}

      {corregida && resultado ? (
        <div className="space-y-3 text-center">
          <div className="rounded-xl bg-card p-5 text-lg ring-1 ring-foreground/10">
            {emoji} {resultado.correctas} de {resultado.total} correctas ({pct}%)
          </div>
          <Button variant="outline" onClick={nuevaPrueba} disabled={generando}>
            {generando ? "Generando…" : "↺ Nueva prueba"}
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <Button onClick={corregir} size="lg">
            Ver resultados
          </Button>
        </div>
      )}
    </div>
  );
}
