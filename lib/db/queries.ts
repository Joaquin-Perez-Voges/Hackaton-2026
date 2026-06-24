import { and, desc, eq } from "drizzle-orm";
import { db } from "./index";
import {
  type MateriaConPruebas,
  type Pregunta,
  type Prueba,
  materias,
  pruebas,
} from "./schema";

/** Lista las materias del usuario (más nuevas primero) con sus pruebas. */
export async function listarMaterias(
  userId: string
): Promise<MateriaConPruebas[]> {
  const ms = await db
    .select()
    .from(materias)
    .where(eq(materias.userId, userId))
    .orderBy(desc(materias.createdAt));
  const out: MateriaConPruebas[] = [];
  for (const m of ms) {
    const ps = await db
      .select()
      .from(pruebas)
      .where(eq(pruebas.materiaId, m.id))
      .orderBy(desc(pruebas.createdAt));
    out.push({ ...m, pruebas: ps });
  }
  return out;
}

/** Obtiene una materia del usuario por id con sus pruebas, o null si no es suya. */
export async function obtenerMateria(
  id: string,
  userId: string
): Promise<MateriaConPruebas | null> {
  const [m] = await db
    .select()
    .from(materias)
    .where(and(eq(materias.id, id), eq(materias.userId, userId)));
  if (!m) return null;
  const ps = await db
    .select()
    .from(pruebas)
    .where(eq(pruebas.materiaId, id))
    .orderBy(desc(pruebas.createdAt));
  return { ...m, pruebas: ps };
}

/** Crea una materia (del usuario) junto con su primera prueba. */
export async function insertarMateria(data: {
  userId: string;
  nombre: string;
  texto: string;
  resumen: string;
  preguntas: Pregunta[];
}): Promise<MateriaConPruebas> {
  const [m] = await db
    .insert(materias)
    .values({
      userId: data.userId,
      nombre: data.nombre,
      texto: data.texto,
      resumen: data.resumen,
    })
    .returning();
  const [p] = await db
    .insert(pruebas)
    .values({ materiaId: m.id, preguntas: data.preguntas })
    .returning();
  return { ...m, pruebas: [p] };
}

/** Agrega una prueba nueva a una materia existente. */
export async function insertarPrueba(
  materiaId: string,
  preguntas: Pregunta[]
): Promise<Prueba> {
  const [p] = await db
    .insert(pruebas)
    .values({ materiaId, preguntas })
    .returning();
  return p;
}

/** Guarda el resultado (correctas/total) de una prueba. */
export async function guardarResultadoPrueba(
  pruebaId: string,
  correctas: number,
  total: number
): Promise<void> {
  await db
    .update(pruebas)
    .set({ correctas, total })
    .where(eq(pruebas.id, pruebaId));
}

/** Elimina una materia del usuario (sus pruebas se borran en cascada). */
export async function borrarMateria(id: string, userId: string): Promise<void> {
  await db
    .delete(materias)
    .where(and(eq(materias.id, id), eq(materias.userId, userId)));
}
