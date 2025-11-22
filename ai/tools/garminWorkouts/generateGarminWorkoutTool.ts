import { tool } from "ai";
import { z } from "zod";
import {
  CreateGarminExerciseWorkoutSchema,
  WorkoutSegmentSchema,
} from "./workoutStepSchema";

export const generateGarminWorkoutTool = tool({
  name: "generateGarminWorkout",
  description:
    "Takes in Segments and returns a full garmin exercise workout plan. You must generate a creative Workout Name and a detailed Workout Description based on the segments and context provided.",
  inputSchema: z.object({
    sport: z.enum(["STRENGTH_TRAINING", "YOGA", "PILATES"]),
    segments: z
      .array(WorkoutSegmentSchema)
      .describe("Array of running segments to include in the workout."),
    context: z
      .string()
      .optional()
      .describe("Optional context or goals for the overall workout."),
    workoutName: z
      .string()
      .min(1)
      .describe(
        "Creative and descriptive name for the workout based on the segments"
      ),
    description: z
      .string()
      .optional()
      .describe(
        "Detailed description of the workout, its goals, and what the athlete will accomplish"
      ),
    conversationId: z.string().describe("The conversation ID"),
  }),
  outputSchema: CreateGarminExerciseWorkoutSchema,
  execute: async ({
    segments,
    workoutName,
    description,
    conversationId,
    sport,
  }) => {
    return {
      workoutName,
      description: description || "",
      sport,
      workoutProvider: "RabbitRabbit" as const,
      workoutSourceId: "RabbitRabbit" as const,
      segments: segments,
      conversationId,
    };
  },
});
