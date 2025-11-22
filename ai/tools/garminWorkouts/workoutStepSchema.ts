import { z } from "zod";
import {
  DurationTypeEnum,
  DurationValueType,
  IntensityEnum,
  RepeatTypeEnum,
  TargetTypeEnum,
  TargetValue,
} from "../running/runningStepSchema";

export const WorkoutStepSchema = z.object({
  type: z.literal("WorkoutStep"),
  intensity: IntensityEnum,
  description: z.string().max(512).optional(),
  durationType: DurationTypeEnum,
  durationValue: z
    .number()
    .describe("Paired with durationType, this numeric value is a double."),
  durationValueType: DurationValueType.optional().describe(
    "If durationType is `HR` or `POWER`, include this"
  ),
  stepOrder: z.number().describe("The step order in the sequence."),
  targetType: TargetTypeEnum,
  targetValue: TargetValue.optional().describe(
    "Included when using HR or Power as TargetType"
  ),
  targetValueLow: z
    .number()
    .optional()
    .describe(
      "Lower bound of target range for target. Don't use pace for non-running workouts."
    ),
  targetValueHigh: z
    .number()
    .optional()
    .describe(
      "Upper bound of target range for target. Don't use pace for non-running workouts."
    ),

  exerciseCateogry: z
    .string()
    .describe(
      "The exercise category for the workout step. You will use data from other tools to populate this."
    ),

  exerciseName: z
    .string()
    .describe(
      "The exercise name for the workout step. You will use data from other tools to populate this."
    ),
  weightValue: z
    .number()
    .optional()
    .default(0)
    .describe(
      "The weight value for the workout step, if applicable. Defaults to 0, but feel free to omit if doing something where this doesn't make sense. This value is in Kilograms. ONLY used for STRENGTH_TRAINING workouts."
    ),
  weightDisplayUnit: z
    .enum(["KILOGRAM", "POUND"])
    .optional()
    .default("POUND")
    .describe(
      "The weight display unit for the workout step. Defaults to POUND. Only included and used if weightValue is included."
    ),
});

export const WorkoutRepeatStepSchema = z.object({
  type: z.literal("WorkoutRepeatStep"),
  steps: z.array(WorkoutStepSchema),
  stepOrder: z.number().describe("The step order in the sequence."),
  skipLastRestStep: z.boolean().default(false),
  repeatValue: z
    .number()
    .min(1)
    .describe("Number of times to repeat the steps"),
  repeatType: RepeatTypeEnum.default("REPEAT_UNTIL_STEPS_CMPLT").describe(
    "Type of repeat action"
  ),
});
export const WorkoutSegmentSchema = z.object({
  segmentOrder: z.number().default(1),
  sport: z.enum(["STRENGTH_TRAINING", "YOGA", "PILATES"]),
  steps: z.array(z.union([WorkoutStepSchema, WorkoutRepeatStepSchema])),
});

export const CreateGarminExerciseWorkoutSchema = z.object({
  workoutName: z.string().min(1, "Workout name is required"),
  description: z.string().optional(),
  sport: z.enum(["STRENGTH_TRAINING", "YOGA", "PILATES"]),
  workoutProvider: z.literal("RabbitRabbit"),
  workoutSourceId: z
    .literal("RabbitRabbit")
    .describe("Must match workoutProvider for Garmin API"),
  segments: z.array(WorkoutSegmentSchema),
  conversationId: z
    .string()
    .describe("Conversation ID associated with the workout"),
});

export type CreateGarminExerciseWorkoutType = z.infer<
  typeof CreateGarminExerciseWorkoutSchema
>;
