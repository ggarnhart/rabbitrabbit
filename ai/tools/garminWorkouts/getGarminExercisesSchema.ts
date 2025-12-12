import { z } from "zod";

export const GetGarminExercisesSchema = z.object({
  type: z.enum(["STRENGTH", "PILATES", "YOGA"]),
  targets: z
    .array(z.string())
    .describe("List of exercise categories to select from our database."),
  results: z
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
});
