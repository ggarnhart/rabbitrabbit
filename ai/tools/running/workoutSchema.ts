import { z } from "zod";
import { RunningSegmentSchema } from "./runningSegmentSchema";
export const CreateWorkoutSchema = z.object({
  workoutName: z.string().min(1, "Workout name is required"),
  description: z.string().optional(),
  sport: z.literal("RUNNING"),
  workoutProvider: z.literal("RabbitRabbit"),
  workoutSourceId: z.string().describe("Unique Identifier from RabbitRabbit"),
  segments: z.array(RunningSegmentSchema),
});
