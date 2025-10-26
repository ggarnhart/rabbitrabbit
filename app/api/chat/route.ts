import { runningPrompt } from "@/ai/systemPrompts/runningPrompt";
import {
  runningToolset,
  RunningToolsetTools,
} from "@/ai/tools/running/runningToolset";
import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  UIDataTypes,
  UIMessage,
} from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export type RabbitRabbitChatMessage = UIMessage<
  never,
  UIDataTypes,
  RunningToolsetTools
>;
export async function POST(req: Request) {
  const body = await req.json();

  const { messages }: { messages: UIMessage[] } = body;

  if (!messages) {
    return new Response("No messages provided", { status: 400 });
  }

  const result = streamText({
    model: openai("gpt-5"),
    system: runningPrompt,
    tools: runningToolset,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(50),
    onError: (error) => {
      console.error("Error during chat processing:", error);
    },
  });

  return result.toUIMessageStreamResponse();
}
