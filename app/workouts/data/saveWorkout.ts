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

      // Check if user has WORKOUT_IMPORT permission
      const permissions = await garminClient.getTrainingPermissions();
      if (!permissions.includes("WORKOUT_IMPORT")) {
        throw new Error(
          "User has not granted WORKOUT_IMPORT permission to RabbitRabbit."
        );
      }

      // Create workout in Garmin Connect
      // Note: You'll need to transform your workout schema to Garmin's format
      // The createWorkout method expects Garmin's workout format with segments/steps
      const resultingWorkout = await garminClient.createWorkout({
        workoutName: workout.workoutName,
        description: workout.description,
        sport: workout.sport,
        workoutProvider: workout.workoutProvider,
        workoutSourceId: workout.workoutSourceId,
        segments: workout.segments,
      });
      console.log(resultingWorkout);
    }

    return data;
  } catch (e) {
    console.error("Error saving workout:", e);
    throw e;
  }
};
