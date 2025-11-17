import { z } from "zod";

export const IntensityEnum = z.enum([
  "REST",
  "WARMUP",
  "COOLDOWN",
  "RECOVERY",
  "ACTIVE",
  "INTERVAL",
]);

export const DurationTypeEnum = z.enum([
  "TIME",
  "DISTANCE",
  "HR_LESS_THAN",
  "HR_GREATER_THAN",
  "CALORIES",
  "OPEN",
  "POWER_LESS_THAN",
  "POWER_GREATER_THAN",
  "TIME_AT_VALID_CDA",
  "FIXED_REST",
]);

export const TargetTypeEnum = z
  .enum([
    "SPEED",
    "HEART_RATE",
    "CADENCE",
    "POWER",
    "GRADE",
    "RESISTANCE",
    "POWER_3S",
    "POWER_10S",
    "POWER_30S",
    "POWER_LAP",
    "SPEED_LAB",
    "HEART_RATE",
    "OPEN",
    "PACE",
  ])
  .describe("Pace is in Meters Per Second (m/s)");

export const HeartRateTargetValue = z
  .number()
  .min(1)
  .max(5)
  .describe("to be used with Targeting Heart Rate");
export const PowerZoneTargetValue = z
  .number()
  .min(1)
  .max(7)
  .describe("to be used with Targeting Power Zones");

export const TargetValue = z.union([
  HeartRateTargetValue,
  PowerZoneTargetValue,
]);

export const DurationValueType = z.literal("PERCENT");

export const RunningStepSchema = z.object({
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
      "Lower bound of target range for target. If target is pace, use the `targetValueLow` from generated pace. This is the faster of the two paces."
    ),
  targetValueHigh: z
    .number()
    .optional()
    .describe(
      "Upper bound of target range for target. If target is pace, use the `targetValueHigh` from generated pace. This is the slower of the two paces."
    ),
});

export type RunningStep = z.infer<typeof RunningStepSchema>;

export const RepeatTypeEnum = z.enum([
  "REPEAT_UNTIL_STEPS_CMPLT",
  "REPEAT_UNTIL_TIME",
  "REPEAT_UNTIL_DISTANCE",
  "REPEAT_UNTIL_CALORIES",
  "REPEAT_UNTIL_HR_LESS_THAN",
  "REPEAT_UNTIL_HR_GREATER_THAN",
  "REPEAT_UNTIL_POWER_LESS_THAN",
  "REPEAT_UNTIL_POWER_GREATER_THAN",
  "REPEAT_UNTIL_POWER_LAST_LAP_LESS_THAN",
  "REPEAT_UNTIL_MAX_POWER_LAST_LAP_LESS_THAN",
]);

export const RunningRepeatStepSchema = z.object({
  type: z.literal("WorkoutRepeatStep"),
  steps: z.array(RunningStepSchema),
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

export const RunningRepeatStepInputSchema = RunningRepeatStepSchema.extend({
  context: z.string().describe("Context for the repetitive running step."),
  stepOrder: z
    .number()
    .optional()
    .describe(
      "The step number in the sequence. Should be the previous step order plus one."
    ),
});
