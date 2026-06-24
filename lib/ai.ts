import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import type { Materia } from "./db/schema";

// Modelos de Claude vía @ai-sdk/anthropic (usa ANTHROPIC_API_KEY del entorno).
// Default: Haiku 4.5 — el más rápido y barato (sin "extended thinking", o sea
// el menor esfuerzo/costo posible). Subí a "claude-sonnet-4-6" (balanceado) o
// "claude-opus-4-8" (el más capaz) por env si querés más calidad.
// Nota: el parámetro `effort` no aplica a Haiku 4.5 (la API lo rechaza); por eso
// no lo mandamos. Corre sin thinking, que ya es la configuración más liviana.
export const QUIZ_MODEL = process.env.QUIZ_MODEL ?? "claude-haiku-4-5";
export const TUTOR_MODEL = process.env.TUTOR_MODEL ?? "claude-haiku-4-5";
export const quizModel = anthropic(QUIZ_MODEL);
export const tutorModel = anthropic(TUTOR_MODEL);

const preguntaSchema = z.object({
  pregunta: z.string().describe("El enunciado de la pregunta"),
  opciones: z
    .array(z.string())
    .length(4)
    .describe('Exactamente 4 opciones, prefijadas "A. ", "B. ", "C. ", "D. "'),
  correcta: z
    .number()
    .int()
    .min(0)
    .max(3)
    .describe("Índice (0=A, 1=B, 2=C, 3=D) de la opción correcta"),
});

export const quizSchema = z.object({
  resumen: z
    .string()
    .describe("Resumen conciso de las ideas principales del texto"),
  preguntas: z.array(preguntaSchema).min(1),
});

export type Quiz = z.infer<typeof quizSchema>;

function armarPrompt(texto: string, cantidad: number, previas: string[] = []) {
  const aviso =
    previas.length > 0
      ? `\nIMPORTANTE: estas preguntas ya se usaron antes, NO las repitas:\n${previas
          .slice(-30)
          .map((q, i) => `${i + 1}. ${q}`)
          .join("\n")}\n`
      : "";

  return `Actuá como un experto en pedagogía. A partir del TEXTO que te paso al final:
1. RESUMEN: extraé las ideas principales de forma concisa.
2. PREGUNTAS: generá exactamente ${cantidad} preguntas de opción múltiple basadas ÚNICAMENTE en el texto.
   - Cada pregunta tiene exactamente 4 opciones, prefijadas "A. ", "B. ", "C. ", "D. ".
   - Solo una opción es correcta. Evitá opciones ambiguas o tramposas.
   - El campo "correcta" es el índice (0=A, 1=B, 2=C, 3=D) de la opción correcta.
Escribí en español rioplatense, claro y preciso.${aviso}
TEXTO A PROCESAR:
${texto}`;
}

/** Genera resumen + preguntas para un texto. `previas` evita repetir enunciados. */
export async function generarQuiz(
  texto: string,
  cantidad: number,
  previas: string[] = []
): Promise<Quiz> {
  const { object } = await generateObject({
    model: quizModel,
    schema: quizSchema,
    prompt: armarPrompt(texto, cantidad, previas),
  });
  return object;
}

/** System prompt del tutor: acotado al material de la materia, con sus límites. */
export function tutorSystemPrompt(
  materia: Pick<Materia, "nombre" | "texto" | "resumen"> | null
): string {
  if (!materia) {
    return `Sos "el tutor" de NextSelf, un asistente de estudio amable y motivador.
Ayudás al estudiante con cualquier tema que quiera aprender: explicás claro, con
ejemplos y analogías, y lo guiás paso a paso en vez de darle todo masticado.
Animalo a crear materias para generar resúmenes y pruebas. No inventes datos: si
no sabés algo, decilo. Sé breve y conversacional, en español rioplatense.`;
  }

  return `Sos "el tutor" de NextSelf, un asistente de estudio para la materia "${materia.nombre}".
Tu objetivo es que el estudiante ENTIENDA el material, adaptándote a su ritmo y a sus preguntas.

REGLAS Y LÍMITES:
- Respondé SOLO con base en el MATERIAL de abajo. Si algo no está en el material, aclaralo y no inventes.
- Explicá de forma clara y progresiva; usá ejemplos y analogías cuando ayuden.
- Si te piden directamente las respuestas de una prueba, no las des: guialos con pistas para que las razonen.
- Sé breve y conversacional. Escribí en español rioplatense.

RESUMEN DEL MATERIAL:
${materia.resumen}

MATERIAL COMPLETO:
${materia.texto}`;
}
