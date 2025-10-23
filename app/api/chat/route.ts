import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, UIMessage } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();
  console.log("Received request body:", body);

  const { messages }: { messages: UIMessage[] } = body;

  if (!messages) {
    return new Response("No messages provided", { status: 400 });
  }

  const result = streamText({
    model: openai("gpt-4.1"),
    system: "You are a helpful assistant.",
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
