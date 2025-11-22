import { z } from "zod";
export const GetExerciseCategoriesSchema = z.object({
  type: z.enum(["STRENGTH", "PILATES", "YOGA"]),
  categories: z.array(
    z.object({
      type: z.string(),
      exercise_category: z.string(),
    })
  ),
});
