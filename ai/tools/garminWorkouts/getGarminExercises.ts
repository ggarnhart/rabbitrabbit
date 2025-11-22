import { tool } from "ai";
import { GetGarminExercisesSchema } from "./getGarminExercisesSchema";
import { createClient } from "@/lib/supabase/server";

export const getGarminExercises = tool({
  name: "getGarminExercises",
  description:
    "Fetches a list of relevant Garmin Exercises based on the user's request",
  inputSchema: GetGarminExercisesSchema,
  outputSchema: GetGarminExercisesSchema,
  execute: async (workout) => {
    const supabase = await createClient();
    const exercises = await supabase
      .from("garmin_exercises")
      .select(
        "id,exercise_category,exercise_name,type,tags,equipment,description"
      )
      .eq("type", workout.type)
      .in("exercise_category", workout.targets);

    return {
      ...workout,
      results: exercises.data || [],
    };
  },
});
