import { runningPrompt } from "@/ai/systemPrompts/runningPrompt";
import {
  runningToolset,
  RunningToolsetTools,
} from "@/ai/tools/running/runningToolset";
import {
  strengthToolset,
  StrengthToolsetTools,
} from "@/ai/tools/strength/strengthToolset";
import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  UIDataTypes,
  UIMessage,
} from "ai";
import { saveMessages } from "@/lib/conversations/db";
import { anthropic } from "@ai-sdk/anthropic";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Combine all toolsets
const allTools = {
  ...runningToolset,
  ...strengthToolset,
};

export type RabbitRabbitChatMessage = UIMessage<
  never,
  UIDataTypes,
  RunningToolsetTools | StrengthToolsetTools
>;

export async function POST(req: Request) {
  const body = await req.json();
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  const { messages }: { messages: UIMessage[] } = body;

  if (!messages) {
    return new Response("No messages provided", { status: 400 });
  }

  if (!conversationId) {
    console.log("No conversation ID provided");
    return new Response("No conversation ID provided", { status: 400 });
  }

  const modelMessages = convertToModelMessages(messages);

  // Debug: Log converted messages
  console.log(`Converted to ${modelMessages.length} model messages`);

  const result = streamText({
    // model: openai("gpt-4.1"),
    model: anthropic("claude-haiku-4-5"),
    system: runningPrompt,
    tools: allTools,
    messages: modelMessages,
    stopWhen: stepCountIs(100), // Enable multi-step, stop after 100 steps

    onError: (error) => {
      console.error("Error during chat processing:", error);
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,

    onFinish: async ({ messages }) => {
      await saveMessages(conversationId, messages);
    },
  });
}
