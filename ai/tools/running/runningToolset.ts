import { InferUITools, TypedToolCall, TypedToolResult } from "ai";
import { convertPaceTool } from "./convertPaceTool";
import { generateRepetitiveRunningStepTool } from "./generateRepetitiveRunningStepTool";
import { generateSingleRunningStepTool } from "./generateSingleRunningStepTool";
import { generateRunningSegmentTool } from "./generateRunningSegmentTool";
import { generateRunningWorkoutTool } from "./generateRunningWorkoutTool";
import { saveToGarminTool } from "./saveToGarmin";
import { selectGarminExercisesWorkoutTool } from "../garminWorkouts/selectGarminExercisesWorkoutTool";
import { getExerciseCategoriesTool } from "../garminWorkouts/getExerciseCategories";
import { getGarminExercises } from "../garminWorkouts/getGarminExercises";
import { generateSingleStepGarminWorkoutTool } from "../garminWorkouts/generateSingleStepGarminWorkoutTool";
import { generateRepetitiveGarminWorkoutStepTool } from "../garminWorkouts/generateRepetitiveGarminWorkoutStepTool";
import { generateGarminWorkoutSegmentTool } from "../garminWorkouts/generateGarminWorkoutSegmentTool";
import { generateGarminWorkoutTool } from "../garminWorkouts/generateGarminWorkoutTool";

export const garminToolset = {
  convertPaceTool: convertPaceTool,
  generateSingleRunningStepTool: generateSingleRunningStepTool,
  generateRepetitiveRunningStepTool: generateRepetitiveRunningStepTool,
  generateRunningSegmentTool: generateRunningSegmentTool,
  generateRunningWorkoutTool: generateRunningWorkoutTool,
  saveToGarminTool: saveToGarminTool,
  buildGarminExerciseWorkoutTool: selectGarminExercisesWorkoutTool,
  getExerciseCategoriesTool: getExerciseCategoriesTool,
  getGarminExercises: getGarminExercises,
  generateSingleStepGarminWorkoutTool: generateSingleStepGarminWorkoutTool,
  generateRepetitiveGarminWorkoutStepTool:
    generateRepetitiveGarminWorkoutStepTool,
  generateGarminWorkoutSegmentTool: generateGarminWorkoutSegmentTool,
  generateGarminWorkoutTool: generateGarminWorkoutTool,
};

export type GarminToolset = InferUITools<typeof garminToolset>;
export type GarminToolCalls = TypedToolCall<typeof garminToolset>;
export type GarminToolResponses = TypedToolResult<typeof garminToolset>;
