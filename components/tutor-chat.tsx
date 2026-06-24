"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TutorChat({ materiaId }: { materiaId?: string }) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: materiaId ? { materiaId } : undefined,
    }),
  });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = input.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  return (
    <div className="flex h-[60vh] flex-col rounded-xl ring-1 ring-foreground/10">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mx-auto max-w-sm py-10 text-center text-sm text-muted-foreground">
            {materiaId
              ? "Preguntale al tutor lo que quieras sobre esta materia. Te explica con ejemplos y te guía sin darte las respuestas masticadas."
              : "Preguntale al tutor sobre cualquier tema que estés estudiando. Te explica con ejemplos y te guía paso a paso."}
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {m.parts.map((p, i) =>
                p.type === "text" ? <span key={i}>{p.text}</span> : null
              )}
            </div>
          </div>
        ))}
        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-3.5 py-2 text-sm text-muted-foreground">
              Pensando…
            </div>
          </div>
        )}
      </div>

      <form className="flex gap-2 border-t p-3" onSubmit={enviar}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí tu pregunta…"
          disabled={busy}
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
