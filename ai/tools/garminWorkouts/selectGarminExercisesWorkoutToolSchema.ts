import { z } from "zod";
export const BuildGarminExerciseWorkoutToolSchema = z.object({
  availableExercises: z
    .array(
      z.object({
        id: z.number(),
        exercise_category: z.string(),
        exercise_name: z.string(),
        type: z.enum(["STRENGTH", "PILATES", "YOGA"]),
        tags: z.array(z.string()),
        equipment: z.array(z.string()),
        description: z.string(),
      })
    )
    .describe(
      "List of Garmin exercises matching the criteria. These will be used in buildGarminExerciseWorkoutTool"
    ),
  selectedExercises: z
    .array(
      z.object({
        id: z.number(),
        exercise_category: z.string(),
        exercise_name: z.string(),
        type: z.enum(["STRENGTH", "PILATES", "YOGA"]),
        tags: z.array(z.string()),
        equipment: z.array(z.string()),
        description: z.string(),
      })
    )
    .describe("Chosen list of Garmin Exercises to include in the workout."),
});
