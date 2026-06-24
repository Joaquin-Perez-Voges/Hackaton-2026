"use client";

import { Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { eliminarMateria } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MateriaCard({
  id,
  nombre,
  cantPreguntas,
  cantPruebas,
}: {
  id: string;
  nombre: string;
  cantPreguntas: number;
  cantPruebas: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function borrar() {
    startTransition(async () => {
      const res = await eliminarMateria(id);
      if (res.ok) {
        toast.success("Materia eliminada");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10 transition hover:ring-foreground/25">
      <Link href={`/materia/${id}`} className="min-w-0 flex-1">
        <span className="block truncate font-medium">{nombre}</span>
        <span className="text-xs text-muted-foreground">
          {cantPreguntas} preguntas · {cantPruebas}{" "}
          {cantPruebas === 1 ? "prueba" : "pruebas"}
        </span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Opciones" />
          }
        >
          ⋮
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onClick={borrar}
            disabled={pending}
          >
            <Trash2Icon /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
