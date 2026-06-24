"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/auth-client";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const { error } =
        mode === "signin"
          ? await signIn.email({ email, password })
          : await signUp.email({ email, password, name });
      if (error) {
        toast.error(error.message ?? "No se pudo completar. Probá de nuevo.");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  function google() {
    signIn.social({ provider: "google", callbackURL: "/" });
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
      <h1 className="text-center font-heading text-3xl font-bold text-primary">
        NextSelf
      </h1>
      <p className="mt-1 mb-6 text-center text-sm text-muted-foreground">
        {mode === "signin"
          ? "Entrá para seguir tu racha."
          : "Creá tu cuenta para empezar a estudiar."}
      </p>

      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={pending}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={pending}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending
            ? "Un momento…"
            : mode === "signin"
              ? "Ingresar"
              : "Crear cuenta"}
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        o
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={google}
        disabled={pending}
      >
        Continuar con Google
      </Button>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {mode === "signin" ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Creá una" : "Ingresá"}
        </button>
      </p>
    </div>
  );
}
