import RabbitConsultation from "@/components/RabbitConsultation";
import { createClient } from "@/lib/supabase/server";
import { HomeWrapper } from "@/components/HomeWrapper";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let hasGarminAuth = false;

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('garmin_api_token, garmin_api_refresh_token')
      .eq('id', user.id)
      .single();

    hasGarminAuth = !!(userData?.garmin_api_token && userData?.garmin_api_refresh_token);
  }

  return <HomeWrapper hasGarminAuth={hasGarminAuth} />;
}
