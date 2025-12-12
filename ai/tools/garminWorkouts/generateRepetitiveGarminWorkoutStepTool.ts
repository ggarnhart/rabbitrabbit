import { tool } from "ai";
import { WorkoutRepeatStepSchema } from "./workoutStepSchema";

export const generateRepetitiveGarminWorkoutStepTool = tool({
  name: "generateRepetitiveGarminWorkoutStep",
  description:
    "Generates a repetitive garmin workout step based on the provided context.",
  inputSchema: WorkoutRepeatStepSchema,
  outputSchema: WorkoutRepeatStepSchema,
  execute: async (input) => {
    return input;
  },
});
