import { tool } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const findExercisesTool = tool({
  name: "findExercises",
  description:
    "Searches the garmin_exercises database to find exercises matching specific criteria. " +
    "Use this when a user requests exercises for a specific body part (e.g., 'arms workout', 'leg exercises'), " +
    "equipment type (e.g., 'dumbbell exercises'), or exercise category. " +
    "You can filter by tags (body parts, movement types), exercise category, type, and required equipment.",
  inputSchema: z.object({
    tags: z
      .array(z.string())
      .optional()
      .describe(
        "Tags to filter by (e.g., ['arms', 'biceps'] or ['legs', 'quads']). " +
          "The search will return exercises that have ANY of these tags."
      ),
    exerciseCategory: z
      .string()
      .optional()
      .describe(
        "Exercise category to filter by (e.g., 'UPPER_BODY', 'LOWER_BODY', 'CORE'). " +
          "Use this for broader categorization."
      ),
    type: z
      .string()
      .optional()
      .describe(
        "Exercise type to filter by (e.g., 'strength', 'cardio', 'flexibility')"
      ),
    equipment: z
      .array(z.string())
      .optional()
      .describe(
        "Equipment required for exercises (e.g., ['dumbbells'], ['bodyweight']). " +
          "The search will return exercises that use ANY of this equipment."
      ),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe(
        "Maximum number of exercises to return. Defaults to 10. Use a higher number for more variety."
      ),
  }),
  outputSchema: z.object({
    exercises: z.array(
      z.object({
        id: z.number(),
        exerciseName: z.string(),
        exerciseCategory: z.string(),
        type: z.string(),
        description: z.string(),
        equipment: z.array(z.string()),
        tags: z.array(z.string()),
      })
    ),
    count: z.number().describe("Total number of exercises found"),
  }),
  execute: async ({
    tags,
    exerciseCategory,
    type,
    equipment,
    limit = 10,
  }) => {
    const supabase = await createClient();

    // Build the query
    let query = supabase
      .from("garmin_exercises")
      .select("*")
      .limit(limit);

    // Apply filters
    if (tags && tags.length > 0) {
      // Filter for exercises that have any of the specified tags
      query = query.overlaps("tags", tags);
    }

    if (exerciseCategory) {
      query = query.eq("exercise_category", exerciseCategory);
    }

    if (type) {
      query = query.eq("type", type);
    }

    if (equipment && equipment.length > 0) {
      // Filter for exercises that use any of the specified equipment
      query = query.overlaps("equipment", equipment);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch exercises: ${error.message}`);
    }

    // Transform the data to match our output schema (camelCase)
    const exercises =
      data?.map((exercise) => ({
        id: exercise.id,
        exerciseName: exercise.exercise_name,
        exerciseCategory: exercise.exercise_category,
        type: exercise.type,
        description: exercise.description,
        equipment: exercise.equipment,
        tags: exercise.tags,
      })) || [];

    return {
      exercises,
      count: exercises.length,
    };
  },
});
