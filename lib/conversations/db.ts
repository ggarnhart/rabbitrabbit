import { RabbitRabbitChatMessage } from "@/app/api/chat/route";
import { createClient } from "@/lib/supabase/server";
import { UIMessage } from "ai";

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  parts: UIMessage["parts"];
  metadata?: Record<string, any> | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get the most recent conversation for a user
 */
export async function getLatestConversation(
  userId: string
): Promise<Conversation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching latest conversation:", error);
    return null;
  }

  return data;
}

/**
 * Get a specific conversation by ID
 */
export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error fetching conversation:", error);
    return null;
  }

  return data;
}

/**
 * Get all messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string
): Promise<Message[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  return data || [];
}

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  title?: string
): Promise<Conversation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      title: title || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    return null;
  }

  return data;
}

/**
 * Save a message to a conversation (avoids duplicates by message ID)
 */
export async function saveMessages(
  conversationId: string,
  messages: UIMessage[]
) {
  const supabase = await createClient();

  await supabase.from("messages").upsert(
    messages.map((m) => ({
      id: m.id === "" ? crypto.randomUUID() : m.id, // server-generated stable id
      conversation_id: conversationId,
      role: m.role,
      parts: m.parts, // full parts, as-is
      metadata: m.metadata ?? null,
    })),
    { onConflict: "id", ignoreDuplicates: true }
  );
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("conversations")
    .update({ title })
    .eq("id", conversationId);

  if (error) {
    console.error("Error updating conversation title:", error);
    return false;
  }

  return true;
}
