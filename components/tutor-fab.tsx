"use client";

import { MessagesSquareIcon } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TutorChat } from "./tutor-chat";

/** Botón flotante para abrir el tutor sin salir de la página (ej: durante la prueba). */
export function TutorFab({ materiaId }: { materiaId?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Abrir tutor"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-24 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:opacity-90 md:right-8 md:bottom-8"
      >
        <MessagesSquareIcon className="size-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tutor IA</DialogTitle>
          </DialogHeader>
          <TutorChat materiaId={materiaId} />
        </DialogContent>
      </Dialog>
    </>
  );
}
