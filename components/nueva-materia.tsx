"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { crearMateria } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function NuevaMateria() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [texto, setTexto] = useState("");
  const [cantidad, setCantidad] = useState(5);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const res = await crearMateria({
        nombre,
        texto,
        cantidadPreguntas: cantidad,
      });
      if (res.ok) {
        toast.success("Materia creada");
        setOpen(false);
        setNombre("");
        setTexto("");
        setCantidad(5);
        router.push(`/materia/${res.id}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className="mt-6 w-full" size="lg" />}
      >
        + Nueva materia
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva materia</DialogTitle>
          <DialogDescription>
            Pegá el texto a estudiar y la IA arma un resumen y una prueba.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Historia — Revolución de Mayo"
              disabled={pending}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="texto">Texto a estudiar</Label>
            <Textarea
              id="texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={8}
              placeholder="Pegá acá el material…"
              disabled={pending}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cantidad">Cantidad de preguntas</Label>
            <Input
              id="cantidad"
              type="number"
              min={1}
              max={20}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="w-24"
              disabled={pending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Generando…" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
