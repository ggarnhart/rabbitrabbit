import { tool } from "ai";
import { z } from "zod";
import {
  RunningRepeatStepSchema,
  RunningStepSchema,
} from "./runningStepSchema";

export const generateRepetitiveRunningStepTool = tool({
  name: "generateRepetitiveRunningStep",
  description:
    "Generates a repetitive running step based on the provided context. In the instance a pace is mentioned, use the convertPaceTool to take a convert to meters per.",
  inputSchema: z.object({
    context: z
      .string()
      .describe("Context for the repetitive running step to be generated."),
    stepNumber: z
      .number()
      .optional()
      .describe("The step number in the sequence."),
    steps: z.array(RunningStepSchema).describe("The Steps to be Repeated."),
  }),
  outputSchema: RunningRepeatStepSchema,
});
