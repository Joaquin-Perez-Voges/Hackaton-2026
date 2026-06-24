import type { Metadata } from "next";
import { TutorChat } from "@/components/tutor-chat";

export const metadata: Metadata = { title: "Tutor — NextSelf" };

export default function TutorPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-6 py-8 md:py-10">
      <header className="mb-5">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Tutor IA
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preguntale lo que quieras. Para repasar un tema puntual, entrá a una
          materia y usá su tutor.
        </p>
      </header>
      <TutorChat />
    </div>
  );
}
