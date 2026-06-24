"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import { useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Response } from "@/components/ai-elements/response";
import { cn } from "@/lib/utils";

function textOf(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

export function TutorChat({ materiaId }: { materiaId?: string }) {
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: materiaId ? { materiaId } : undefined,
    }),
  });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = input.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  return (
    <div className="flex h-[60vh] flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <Conversation className="flex-1">
        <ConversationContent>
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
              {m.role === "user" ? (
                <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                  {textOf(m)}
                </div>
              ) : (
                <div className="max-w-full text-sm leading-relaxed">
                  <Response>{textOf(m)}</Response>
                </div>
              )}
            </div>
          ))}

          {status === "submitted" && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                Pensando…
              </div>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <form onSubmit={submit} className="border-t border-border p-2.5">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-2 py-1.5 transition focus-within:border-ring">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(e);
              }
            }}
            rows={1}
            placeholder="Escribí tu pregunta…"
            className="max-h-32 min-h-8 flex-1 resize-none bg-transparent py-1 text-sm outline-none"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => stop()}
              aria-label="Detener"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <SquareIcon className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Enviar"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition disabled:opacity-40"
            >
              <ArrowUpIcon className="size-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
