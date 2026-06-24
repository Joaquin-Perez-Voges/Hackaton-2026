import { type UIMessage, convertToModelMessages, streamText } from "ai";
import { tutorModel, tutorSystemPrompt } from "@/lib/ai";
import { obtenerMateria } from "@/lib/db/queries";
import { getSession } from "@/lib/session";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return new Response("No autorizado", { status: 401 });

  const { messages, materiaId } = (await req.json()) as {
    messages: UIMessage[];
    materiaId?: string;
  };

  // Solo aterriza el tutor en la materia si es del usuario.
  const materia = materiaId
    ? await obtenerMateria(materiaId, session.user.id)
    : null;

  const result = streamText({
    model: tutorModel,
    system: tutorSystemPrompt(materia),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
