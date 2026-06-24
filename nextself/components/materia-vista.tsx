"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MateriaConPruebas } from "@/lib/db/schema";
import { QuizRunner } from "./quiz-runner";
import { Resultados } from "./resultados";
import { TutorChat } from "./tutor-chat";

export function MateriaVista({ materia }: { materia: MateriaConPruebas }) {
  return (
    <Tabs defaultValue="quiz" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="quiz">Prueba</TabsTrigger>
        <TabsTrigger value="tutor">Tutor IA</TabsTrigger>
        <TabsTrigger value="resultados">Resultados</TabsTrigger>
      </TabsList>

      <TabsContent value="quiz" className="pt-5" keepMounted>
        <QuizRunner materia={materia} />
      </TabsContent>
      <TabsContent value="tutor" className="pt-5" keepMounted>
        <TutorChat materiaId={materia.id} />
      </TabsContent>
      <TabsContent value="resultados" className="pt-5">
        <Resultados pruebas={materia.pruebas} />
      </TabsContent>
    </Tabs>
  );
}
