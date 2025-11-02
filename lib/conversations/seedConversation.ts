import { nanoid } from "nanoid";
import { createClient } from "../supabase/server";

export const seedConversation = async (
  userId: string,
  conversationId: string
) => {
  const supabase = await createClient();

  const userData = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  const initialMessage = `Important Context Information:
    - The user you're having a conversation with has an ID of ${userData.data?.id}
    - This conversation ID is ${conversationId}`;

  await supabase.from("messages").insert({
    id: nanoid(),
    conversation_id: conversationId,
    role: "system",
    parts: [{ type: "text", text: initialMessage }],
  });
};
