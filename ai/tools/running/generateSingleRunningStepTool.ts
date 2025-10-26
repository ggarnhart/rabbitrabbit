// import { tool } from "ai";
// import { z } from "zod";
// import { RunningStep, RunningStepSchema } from "./runningStepSchema";

// export const generateSingleRunningStepTool = tool({
//   name: "generateSingleRunningStep",
//   description:
//     "Generates a single running step based on the provided context.  In the instance a pace is mentioned, use the convertPaceTool to take a convert to meters per.",
//   inputSchema: z.object({
//     context: z
//       .string()
//       .describe("Context for the running step to be generated."),
//     stepNumber: z
//       .number()
//       .optional()
//       .describe("The step number in the sequence."),
//   }),
//   outputSchema: RunningStepSchema,
//   execute: async ({ context, stepNumber }) => {
//     const defaultRunningStep: RunningStep = {
//       type: "WorkoutStep",
//       intensity: "WARMUP",
//       durationType: "DISTANCE",
//       durationValue: 1600,
//       targetType: "OPEN",
//       stepNumber: stepNumber ?? 1,
//     };
//     return defaultRunningStep;
//   },
// });

import { tool } from "ai";
import { z } from "zod";
import { RunningStep, RunningStepSchema } from "./runningStepSchema";

export const generateSingleRunningStepTool = tool({
  name: "generateSingleRunningStep",
  description:
    "Generates a single running step based on the provided context.  In the instance a pace is mentioned, use the convertPaceTool to take a convert to meters per second.",
  inputSchema: RunningStepSchema,
  outputSchema: RunningStepSchema,
  execute: async (input) => {
    return input;
  },
});
