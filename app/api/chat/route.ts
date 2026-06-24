import { type UIMessage, convertToModelMessages, streamText } from "ai";
import { tutorModel, tutorSystemPrompt } from "@/lib/ai";
import { obtenerMateria } from "@/lib/db/queries";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, materiaId } = (await req.json()) as {
    messages: UIMessage[];
    materiaId?: string;
  };

  const materia = materiaId ? await obtenerMateria(materiaId) : null;

  const result = streamText({
    model: tutorModel,
    system: tutorSystemPrompt(materia),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
