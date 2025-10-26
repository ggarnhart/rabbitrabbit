import { z } from "zod";
import {
  RunningRepeatStepSchema,
  RunningStepSchema,
} from "./runningStepSchema";

export const RunningSegmentSchema = z.object({
  segmentOrder: z.number().default(1),
  sport: z.literal("RUNNING"),
  steps: z.array(z.union([RunningStepSchema, RunningRepeatStepSchema])),
});
