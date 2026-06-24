import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import {
  type MateriaConPruebas,
  type Pregunta,
  type Prueba,
  materias,
  pruebas,
} from "./schema";

/** Lista todas las materias (más nuevas primero) con sus pruebas embebidas. */
export async function listarMaterias(): Promise<MateriaConPruebas[]> {
  const ms = await db.select().from(materias).orderBy(desc(materias.createdAt));
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

/** Obtiene una materia por id con sus pruebas (más nuevas primero), o null. */
export async function obtenerMateria(
  id: string
): Promise<MateriaConPruebas | null> {
  const [m] = await db.select().from(materias).where(eq(materias.id, id));
  if (!m) return null;
  const ps = await db
    .select()
    .from(pruebas)
    .where(eq(pruebas.materiaId, id))
    .orderBy(desc(pruebas.createdAt));
  return { ...m, pruebas: ps };
}

/** Crea una materia junto con su primera prueba. */
export async function insertarMateria(data: {
  nombre: string;
  texto: string;
  resumen: string;
  preguntas: Pregunta[];
}): Promise<MateriaConPruebas> {
  const [m] = await db
    .insert(materias)
    .values({ nombre: data.nombre, texto: data.texto, resumen: data.resumen })
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

/** Elimina una materia (sus pruebas se borran en cascada). */
export async function borrarMateria(id: string): Promise<void> {
  await db.delete(materias).where(eq(materias.id, id));
}
