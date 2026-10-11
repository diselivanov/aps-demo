import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { SYSTEM_PROMPT } from "@/lib/chat/system-prompt";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:3b";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Body = {
  messages: ChatMessage[];
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = (await request.json()) as Body;
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "Пустой запрос" }, { status: 400 });
  }

  const messages = body.messages.slice(-20).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 4000),
  }));

  let res: Response;
  try {
    res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
        options: {
          temperature: 0.4,
          num_predict: 400,
        },
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Консультант недоступен" },
      { status: 503 },
    );
  }

  if (!res.ok || !res.body) {
    return NextResponse.json(
      { error: "Консультант недоступен" },
      { status: 503 },
    );
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
