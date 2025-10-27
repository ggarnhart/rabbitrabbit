"use client";
import { RabbitRabbitChatMessage } from "@/app/api/chat/route";
import { Message as DBMessage } from "@/lib/conversations/db";

export const convertDBMessagesToUI = (
  dbMessages: DBMessage[]
): RabbitRabbitChatMessage[] => {
  return dbMessages.map((msg) => {
    const parts = msg.parts as any[];

    // Filter out reasoning parts - they cannot be sent back to the API
    const filteredParts = parts.filter((part) => {
      // Remove reasoning parts completely
      if (part.type === "reasoning") {
        console.log(`Filtering out reasoning part with ID: ${part.id || 'unknown'}`);
        return false;
      }
      return true;
    });

    console.log(`Message ${msg.id}: ${parts.length} parts -> ${filteredParts.length} parts after filtering`);

    return {
      id: msg.id,
      role: msg.role as "user" | "assistant" | "system",
      parts: filteredParts as RabbitRabbitChatMessage["parts"],
    };
  });
};
