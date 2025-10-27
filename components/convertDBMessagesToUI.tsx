"use client";
import { RabbitRabbitChatMessage } from "@/app/api/chat/route";
import { Message as DBMessage } from "@/lib/conversations/db";

export const convertDBMessagesToUI = (
  dbMessages: DBMessage[]
): RabbitRabbitChatMessage[] => {
  return dbMessages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    parts: msg.parts as RabbitRabbitChatMessage["parts"],
  }));
};
