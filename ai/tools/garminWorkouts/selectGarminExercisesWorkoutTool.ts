import { tool } from "ai";
import { BuildGarminExerciseWorkoutToolSchema } from "./selectGarminExercisesWorkoutToolSchema";

export const selectGarminExercisesWorkoutTool = tool({
  name: "selectGarminExercisesWorkoutTool",
  description:
    "Builds a Garmin Exercise Workout based on user request and available Garmin Exercises.",
  inputSchema: BuildGarminExerciseWorkoutToolSchema,
  outputSchema: BuildGarminExerciseWorkoutToolSchema,
  execute: async (build) => {
    return build;
  },
});
