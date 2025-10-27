import { createClient } from "@/lib/supabase/server";
import { getConversation, getConversationMessages } from "@/lib/conversations/db";
import { redirect } from "next/navigation";
import { ConversationWrapper } from "@/components/ConversationWrapper";

interface ConversationPageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get conversation and verify ownership
  const conversation = await getConversation(conversationId);

  if (!conversation || conversation.user_id !== user.id) {
    // Conversation doesn't exist or doesn't belong to user
    redirect('/');
  }

  // Check Garmin auth
  const { data: userData } = await supabase
    .from('users')
    .select('garmin_api_token, garmin_api_refresh_token')
    .eq('id', user.id)
    .single();

  const hasGarminAuth = !!(userData?.garmin_api_token && userData?.garmin_api_refresh_token);

  // Get messages for this conversation
  const messages = await getConversationMessages(conversationId);

  return (
    <ConversationWrapper
      conversationId={conversationId}
      initialMessages={messages}
      hasGarminAuth={hasGarminAuth}
    />
  );
}
