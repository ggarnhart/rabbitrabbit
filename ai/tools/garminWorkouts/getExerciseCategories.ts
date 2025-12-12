import { createClient } from "@/lib/supabase/server";
import { tool } from "ai";
import { GetExerciseCategoriesSchema } from "./getExerciseCategoriesSchema";

export const getExerciseCategoriesTool = tool({
  name: "getExerciseCategories",
  description:
    "Fetches a list of exercise categories available in the system to help in building future SQL queries.",
  inputSchema: GetExerciseCategoriesSchema,
  outputSchema: GetExerciseCategoriesSchema,
  execute: async (workout) => {
    const supabase = await createClient();
    const types = await supabase
      .from("garmin_exercises")
      .select("exercise_category,type");
    console.log("Fetched Types:", types.data?.length);

    // create a set of unique catories and types {exercise_category, type}
    const setOfLabels = new Set<string>();
    types.data?.forEach((item) => {
      setOfLabels.add(`${item.exercise_category}|||${item.type}`);
    });
    console.log("Unique Categories Found:", setOfLabels.size);
    const uniqueCombinations = Array.from(setOfLabels).map((label) => {
      const [exercise_category, type] = label.split("|||");
      return { exercise_category, type };
    });

    console.log("Unique Categories Length:", uniqueCombinations.length);
    return {
      type: workout.type,
      categories: uniqueCombinations || [],
    };
  },
});
