import { tool } from "ai";
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
