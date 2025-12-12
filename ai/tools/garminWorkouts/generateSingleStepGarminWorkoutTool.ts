import { tool } from "ai";
import { WorkoutStepSchema } from "./workoutStepSchema";

export const generateSingleStepGarminWorkoutTool = tool({
  name: "generateSingleGarminWorkoutStep",
  description:
    "Generates a single garmin workout step based on the provided context. ",
  inputSchema: WorkoutStepSchema,
  outputSchema: WorkoutStepSchema,
  execute: async (input) => {
    return input;
  },
});
