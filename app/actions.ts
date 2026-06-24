"use server";

import { revalidatePath } from "next/cache";
import { generarQuiz } from "@/lib/ai";
import {
  borrarMateria,
  guardarResultadoPrueba,
  insertarMateria,
  insertarPrueba,
  obtenerMateria,
} from "@/lib/db/queries";
import type { Prueba } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

type Resultado<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

function mensajeError(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

/** Crea una materia del usuario: genera resumen + primera prueba con IA. */
export async function crearMateria(input: {
  nombre: string;
  texto: string;
  cantidadPreguntas: number;
}): Promise<Resultado<{ id: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Iniciá sesión para crear materias." };

  const nombre = input.nombre?.trim();
  const texto = input.texto?.trim();
  const cantidad = Math.min(Math.max(Number(input.cantidadPreguntas) || 5, 1), 20);

  if (!nombre) return { ok: false, error: "Ingresá un nombre para la materia." };
  if (!texto) return { ok: false, error: "Pegá el texto a estudiar." };

  try {
    const quiz = await generarQuiz(texto, cantidad);
    const materia = await insertarMateria({
      userId: session.user.id,
      nombre,
      texto,
      resumen: quiz.resumen,
      preguntas: quiz.preguntas,
    });
    revalidatePath("/");
    return { ok: true, id: materia.id };
  } catch (e) {
    return { ok: false, error: mensajeError(e, "Error al generar la materia.") };
  }
}

/** Genera una prueba nueva (no repite enunciados anteriores) para una materia. */
export async function generarNuevaPrueba(
  materiaId: string,
  cantidad?: number
): Promise<Resultado<{ prueba: Prueba }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Iniciá sesión." };

  try {
    const materia = await obtenerMateria(materiaId, session.user.id);
    if (!materia) return { ok: false, error: "Materia no encontrada." };

    const previas = materia.pruebas.flatMap((p) =>
      p.preguntas.map((q) => q.pregunta)
    );
    const n =
      cantidad ??
      materia.pruebas.at(-1)?.preguntas.length ??
      materia.pruebas[0]?.preguntas.length ??
      5;

    const quiz = await generarQuiz(materia.texto, n, previas);
    const prueba = await insertarPrueba(materiaId, quiz.preguntas);
    revalidatePath(`/materia/${materiaId}`);
    return { ok: true, prueba };
  } catch (e) {
    return { ok: false, error: mensajeError(e, "Error al generar la prueba.") };
  }
}

/** Guarda el resultado de una prueba ya realizada (verifica que la materia sea del usuario). */
export async function guardarResultado(
  materiaId: string,
  pruebaId: string,
  correctas: number,
  total: number
): Promise<Resultado> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Iniciá sesión." };

  try {
    const materia = await obtenerMateria(materiaId, session.user.id);
    if (!materia) return { ok: false, error: "Materia no encontrada." };

    await guardarResultadoPrueba(pruebaId, correctas, total);
    revalidatePath(`/materia/${materiaId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: mensajeError(e, "Error al guardar el resultado.") };
  }
}

/** Elimina una materia del usuario y todas sus pruebas. */
export async function eliminarMateria(materiaId: string): Promise<Resultado> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Iniciá sesión." };

  try {
    await borrarMateria(materiaId, session.user.id);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: mensajeError(e, "Error al eliminar la materia.") };
  }
}
