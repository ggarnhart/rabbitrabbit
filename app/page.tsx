import { createClient } from "@/lib/supabase/server";
import { HomeWrapper } from "@/components/HomeWrapper";
import { getLatestConversation, createConversation } from "@/lib/conversations/db";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let hasGarminAuth = false;

  const { data: userData } = await supabase
    .from('users')
    .select('garmin_api_token, garmin_api_refresh_token')
    .eq('id', user.id)
    .single();

  hasGarminAuth = !!(userData?.garmin_api_token && userData?.garmin_api_refresh_token);

  // Get or create a conversation
  let conversation = await getLatestConversation(user.id);

  if (!conversation) {
    // Create a new conversation if none exists
    conversation = await createConversation(user.id);
  }

  if (conversation) {
    // Redirect to the conversation page
    redirect(`/${conversation.id}`);
  }

  // Fallback - show the wrapper (shouldn't normally reach here)
  return <HomeWrapper hasGarminAuth={hasGarminAuth} />;
}
