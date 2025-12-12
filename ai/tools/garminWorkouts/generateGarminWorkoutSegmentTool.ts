import { z } from "zod";

import { tool } from "ai";
import {
  WorkoutRepeatStepSchema,
  WorkoutSegmentSchema,
  WorkoutStepSchema,
} from "./workoutStepSchema";

export const generateGarminWorkoutSegmentTool = tool({
  name: "generateGarminWorkoutSegment",
  description:
    "Generates a Garmin Workout segment by taking the submitted steps and combining them into a segment.",
  inputSchema: z.object({
    sport: z.enum(["STRENGTH_TRAINING", "YOGA", "PILATES"]),
    steps: z
      .array(z.union([WorkoutStepSchema, WorkoutRepeatStepSchema]))
      .describe("Array of running steps to include in the segment."),
  }),
  outputSchema: WorkoutSegmentSchema,
  execute: async ({ steps, sport }) => {
    return {
      segmentOrder: 1,
      sport: sport,
      steps,
    };
  },
});
