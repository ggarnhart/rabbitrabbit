import { tool } from "ai";
import {
  RunningRepeatStepInputSchema,
  RunningRepeatStepSchema,
} from "./runningStepSchema";

export const generateRepetitiveRunningStepTool = tool({
  name: "generateRepetitiveRunningStep",
  description:
    "Generates a repetitive running step based on the provided context. In the instance a pace is mentioned, use the convertPaceTool to take a convert to meters per.",
  inputSchema: RunningRepeatStepInputSchema,
  outputSchema: RunningRepeatStepSchema,
  execute: async (input) => {
    return input;
  },
});
