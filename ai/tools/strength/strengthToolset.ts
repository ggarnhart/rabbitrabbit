import { InferUITools, TypedToolCall, TypedToolResult } from "ai";
import { findExercisesTool } from "./findExercisesTool";

export const strengthToolset = {
  findExercisesTool: findExercisesTool,
};

export type StrengthToolsetTools = InferUITools<typeof strengthToolset>;
export type StrengthToolCalls = TypedToolCall<typeof strengthToolset>;
export type StrengthToolResponses = TypedToolResult<typeof strengthToolset>;
