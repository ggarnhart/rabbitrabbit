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
import { saveMessages } from "@/lib/conversations/db";
import { nanoid } from "nanoid";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export type RabbitRabbitChatMessage = UIMessage<
  never,
  UIDataTypes,
  RunningToolsetTools
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

  // Debug: Log incoming messages
  console.log(`Processing ${messages.length} messages`);
  messages.forEach((msg, idx) => {
    const partTypes = msg.parts?.map(p => (p as any).type).join(", ") || "none";
    console.log(`  Message ${idx} (${msg.role}): ${msg.parts?.length || 0} parts [${partTypes}]`);
  });

  const modelMessages = convertToModelMessages(messages);

  // Debug: Log converted messages
  console.log(`Converted to ${modelMessages.length} model messages`);

  const result = streamText({
    model: openai("gpt-5"),
    system: runningPrompt,
    tools: runningToolset,
    messages: modelMessages,
    stopWhen: stepCountIs(100), // Enable multi-step, stop after 100 steps
    onStepFinish: ({ stepType, text, toolCalls, toolResults, finishReason }) => {
      console.log(`Step finished - Type: ${stepType}, Reason: ${finishReason}`);
      if (text) console.log(`  Text: ${text.substring(0, 100)}...`);
      if (toolCalls && toolCalls.length > 0) {
        console.log(`  Tool calls: ${toolCalls.map((tc) => tc.toolName).join(", ")}`);
      }
      if (toolResults && toolResults.length > 0) {
        console.log(`  Tool results: ${toolResults.length} results`);
      }
    },
    onFinish: ({ text, toolCalls, toolResults, finishReason, usage }) => {
      console.log(`\n=== STREAM FINISHED ===`);
      console.log(`Finish reason: ${finishReason}`);
      console.log(`Total steps: ${usage?.steps || 0}`);
      console.log(`Text generated: ${text?.substring(0, 100) || "none"}...`);
      console.log(`Tool calls: ${toolCalls?.length || 0}`);
      console.log(`======================\n`);
    },
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
