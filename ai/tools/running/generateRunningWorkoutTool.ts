import { tool } from "ai";
import { z } from "zod";
import { RunningSegmentSchema } from "./runningSegmentSchema";
import { CreateWorkoutSchema } from "./workoutSchema";

export const generateRunningWorkoutTool = tool({
  name: "generateRunningWorkout",
  description:
    "Takes in Segments and returns a full running workout plan. You must generate a creative Workout Name and a detailed Workout Description based on the segments and context provided.",
  inputSchema: z.object({
    segments: z
      .array(RunningSegmentSchema)
      .describe("Array of running segments to include in the workout."),
    context: z
      .string()
      .optional()
      .describe("Optional context or goals for the overall workout."),
    workoutName: z
      .string()
      .min(1)
      .describe("Creative and descriptive name for the workout based on the segments"),
    description: z
      .string()
      .optional()
      .describe("Detailed description of the workout, its goals, and what the athlete will accomplish"),
  }),
  outputSchema: CreateWorkoutSchema,
  execute: async ({ segments, context, workoutName, description }) => {
    return {
      workoutName,
      description: description || "",
      sport: "RUNNING" as const,
      workoutProvider: "RabbitRabbit" as const,
      workoutSourceId: crypto.randomUUID(),
      segments: segments,
    };
  },
});
