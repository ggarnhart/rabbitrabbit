import { CreateWorkoutType } from "@/ai/tools/running/workoutSchema";
import { createClient } from "@/lib/supabase/server";
import { GarminClient } from "@/lib/garmin";

export const saveWorkout = async (
  workout: CreateWorkoutType,
  conversationId: string,
  sendToGarmin: boolean
) => {
  try {
    // save to database
    const supabase = await createClient();

    // get user id
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No user found");
    }

    const { data, error } = await supabase
      .from("workouts")
      .insert([
        {
          conversation_id: conversationId,
          user_id: user.id,
          workout_name: workout.workoutName,
          description: workout.description,
          sport: workout.sport,
          workout_provider: workout.workoutProvider,
          workout_source_id: workout.workoutSourceId,
          segments: workout.segments,
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    // Optionally send to Garmin
    if (sendToGarmin && data && data[0]) {
      const garminClient = new GarminClient(user.id);

      // Check if user is authenticated with Garmin
      const isAuthenticated = await garminClient.isAuthenticated();

      if (!isAuthenticated) {
        throw new Error(
          "User not authenticated with Garmin. Please connect your Garmin account first."
        );
      }

      // Import workout to Garmin
      // await garminClient.importWorkout({
      //   id: data[0].id,
      //   ...workout,
      // });
    }

    return data;
  } catch (e) {
    console.error("Error saving workout:", e);
    throw e;
  }
};
