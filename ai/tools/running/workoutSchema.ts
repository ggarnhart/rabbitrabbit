import { z } from "zod";
import { RunningSegmentSchema } from "./runningSegmentSchema";
import { WorkoutSegmentSchema } from "../garminWorkouts/workoutStepSchema";
export const CreateWorkoutSchema = z.object({
  workoutName: z.string().min(1, "Workout name is required"),
  description: z.string().optional(),
  sport: z.enum(["RUNNING", "STRENGTH_TRAINING", "YOGA", "PILATES"]),
  workoutProvider: z.literal("RabbitRabbit"),
  workoutSourceId: z
    .literal("RabbitRabbit")
    .describe("Must match workoutProvider for Garmin API"),
  segments: z.array(z.union([RunningSegmentSchema, WorkoutSegmentSchema])),
  conversationId: z
    .string()
    .describe("Conversation ID associated with the workout"),
});

export type CreateWorkoutType = z.infer<typeof CreateWorkoutSchema>;
