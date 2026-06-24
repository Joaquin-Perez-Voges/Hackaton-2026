"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { generarNuevaPrueba, guardarResultado } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { MateriaConPruebas, Prueba } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function QuizRunner({ materia }: { materia: MateriaConPruebas }) {
  // Prueba inicial: la más nueva que todavía no se respondió.
  const pruebaInicial = useMemo(
    () => materia.pruebas.find((p) => p.correctas == null) ?? null,
    [materia.pruebas]
  );

  const [prueba, setPrueba] = useState<Prueba | null>(pruebaInicial);
  const [idx, setIdx] = useState(0);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctas, setCorrectas] = useState(0);
  const [terminado, setTerminado] = useState(false);
  const [generando, startGen] = useTransition();
  const [, startSave] = useTransition();

  const nuevaPrueba = () => {
    startGen(async () => {
      const res = await generarNuevaPrueba(materia.id);
      if (res.ok) {
        setPrueba(res.prueba);
        setIdx(0);
        setSeleccion(null);
        setChecked(false);
        setCorrectas(0);
        setTerminado(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  if (!prueba) {
    return (
      <div className="rounded-2xl bg-muted/40 px-4 py-10 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          No hay una prueba pendiente. Generá una nueva para practicar.
        </p>
        <Button onClick={nuevaPrueba} disabled={generando}>
          {generando ? "Generando…" : "Generar prueba"}
        </Button>
      </div>
    );
  }

  const preguntas = prueba.preguntas;
  const total = preguntas.length;

  // Pantalla de resultado final.
  if (terminado) {
    const pct = Math.round((correctas / total) * 100);
    const emoji = pct === 100 ? "🎉" : pct >= 60 ? "👍" : "📚";
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-2xl bg-card p-8 ring-1 ring-foreground/10">
          <div className="text-5xl">{emoji}</div>
          <p className="mt-3 text-2xl font-bold">
            {correctas} de {total}
          </p>
          <p className="text-sm text-muted-foreground">{pct}% correctas</p>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={nuevaPrueba}
          disabled={generando}
        >
          {generando ? "Generando…" : "↺ Nueva prueba"}
        </Button>
      </div>
    );
  }

  const q = preguntas[idx];
  const esCorrecta = seleccion != null && seleccion === q.correcta;
  const progreso = Math.round((idx / total) * 100);

  const comprobar = () => {
    if (seleccion == null) return;
    setChecked(true);
    if (seleccion === q.correcta) setCorrectas((c) => c + 1);
  };

  const continuar = () => {
    if (idx + 1 < total) {
      setIdx(idx + 1);
      setSeleccion(null);
      setChecked(false);
      return;
    }
    // Última pregunta → guardar resultado y mostrar pantalla final.
    setTerminado(true);
    const pruebaId = prueba.id;
    const final = correctas;
    startSave(async () => {
      await guardarResultado(materia.id, pruebaId, final, total);
    });
  };

  return (
    <div className="space-y-5">
      {/* Barra de progreso */}
      <div className="flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progreso}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {idx + 1}/{total}
        </span>
      </div>

      {/* Pregunta */}
      <p className="text-lg font-semibold leading-snug">{q.pregunta}</p>

      {/* Opciones */}
      <div className="space-y-2.5">
        {q.opciones.map((op, oi) => {
          const selected = seleccion === oi;
          const showCorrect = checked && oi === q.correcta;
          const showWrong = checked && selected && oi !== q.correcta;
          return (
            <button
              key={oi}
              type="button"
              disabled={checked}
              onClick={() => setSeleccion(oi)}
              className={cn(
                "w-full rounded-2xl border-2 p-4 text-left text-sm font-medium transition",
                !checked && selected && "border-primary bg-primary/5",
                !checked && !selected && "border-border hover:bg-muted/50",
                showCorrect && "border-green-500 bg-green-50 text-green-800",
                showWrong && "border-red-500 bg-red-50 text-red-800",
                checked &&
                  !showCorrect &&
                  !showWrong &&
                  "border-border opacity-60"
              )}
            >
              {op}
            </button>
          );
        })}
      </div>

      {/* Feedback + acción */}
      {checked ? (
        <div className="space-y-3">
          <div
            className={cn(
              "rounded-xl p-3 text-sm font-medium",
              esCorrecta
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            )}
          >
            {esCorrecta
              ? "¡Correcto! 🎉"
              : `Incorrecto. La respuesta era: ${q.opciones[q.correcta]}`}
          </div>
          <Button size="lg" className="w-full" onClick={continuar}>
            {idx + 1 < total ? "Continuar" : "Ver resultado"}
          </Button>
        </div>
      ) : (
        <Button
          size="lg"
          className="w-full"
          onClick={comprobar}
          disabled={seleccion == null}
        >
          Comprobar
        </Button>
      )}
    </div>
  );
}
