import { tool } from "ai";
import { BuildGarminExerciseWorkoutToolSchema } from "./buildGarminExerciseWorkoutToolSchema";

export const buildGarminExerciseWorkoutTool = tool({
  name: "buildGarminExerciseWorkoutTool",
  description:
    "Builds a Garmin Exercise Workout based on user request and available Garmin Exercises.",
  inputSchema: BuildGarminExerciseWorkoutToolSchema,
  outputSchema: BuildGarminExerciseWorkoutToolSchema,
  execute: async (build) => {
    return build;
  },
});
