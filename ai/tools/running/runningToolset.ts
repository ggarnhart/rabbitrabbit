import { InferUITools, TypedToolCall, TypedToolResult } from "ai";
import { convertPaceTool } from "./convertPaceTool";
import { generateRepetitiveRunningStepTool } from "./generateRepetitiveRunningStepTool";
import { generateSingleRunningStepTool } from "./generateSingleRunningStepTool";
import { generateRunningSegmentTool } from "./generateRunningSegmentTool";
import { generateRunningWorkoutTool } from "./generateRunningWorkoutTool";
import { saveToGarminTool } from "./saveToGarmin";

export const runningToolset = {
  convertPaceTool: convertPaceTool,
  generateSingleRunningStepTool: generateSingleRunningStepTool,
  generateRepetitiveRunningStepTool: generateRepetitiveRunningStepTool,
  generateRunningSegmentTool: generateRunningSegmentTool,
  generateRunningWorkoutTool: generateRunningWorkoutTool,
  saveToGarminTool: saveToGarminTool,
};

export type RunningToolsetTools = InferUITools<typeof runningToolset>;
export type RunningToolCalls = TypedToolCall<typeof runningToolset>;
export type RunningToolResponses = TypedToolResult<typeof runningToolset>;
