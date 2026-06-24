import type { InferSelectModel } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

/** Una pregunta de opción múltiple generada por la IA. */
export type Pregunta = {
  pregunta: string;
  opciones: string[]; // siempre 4: "A. ...", "B. ...", "C. ...", "D. ..."
  correcta: number; // índice 0..3 de la opción correcta
};

/** Materia: un tema de estudio con su texto fuente y resumen. */
export const materias = pgTable("materias", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  nombre: text("nombre").notNull(),
  texto: text("texto").notNull(),
  resumen: text("resumen").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Prueba: un set de preguntas para una materia, con su resultado opcional. */
export const pruebas = pgTable("pruebas", {
  id: uuid("id").primaryKey().defaultRandom(),
  materiaId: uuid("materia_id")
    .notNull()
    .references(() => materias.id, { onDelete: "cascade" }),
  preguntas: jsonb("preguntas").$type<Pregunta[]>().notNull(),
  correctas: integer("correctas"),
  total: integer("total"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Materia = InferSelectModel<typeof materias>;
export type Prueba = InferSelectModel<typeof pruebas>;

/** Materia con sus pruebas embebidas (forma usada por la UI). */
export type MateriaConPruebas = Materia & { pruebas: Prueba[] };
