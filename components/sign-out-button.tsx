"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  function cerrar() {
    start(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <Button variant="outline" onClick={cerrar} disabled={pending}>
      <LogOutIcon className="size-4" />
      {pending ? "Saliendo…" : "Cerrar sesión"}
    </Button>
  );
}
