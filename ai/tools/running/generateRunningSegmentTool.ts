import { z } from "zod";
import { RunningSegmentSchema } from "./runningSegmentSchema";
import { tool } from "ai";
import {
  RunningRepeatStepSchema,
  RunningStepSchema,
} from "./runningStepSchema";
export const generateRunningSegmentTool = tool({
  name: "generateRunningSegment",
  description:
    "Generates a running segment by taking the submitted steps and combining them into a segment.",
  inputSchema: z.object({
    steps: z
      .array(z.union([RunningStepSchema, RunningRepeatStepSchema]))
      .describe("Array of running steps to include in the segment."),
  }),
  outputSchema: RunningSegmentSchema,
  execute: async ({ steps }) => {
    return {
      segmentOrder: 1,
      sport: "RUNNING",
      steps,
    };
  },
});
