import { InferUITools } from "ai";
import { selectGarminExercisesWorkoutTool } from "./selectGarminExercisesWorkoutTool";
import { getExerciseCategoriesTool } from "./getExerciseCategories";
import { getGarminExercises } from "./getGarminExercises";
import { generateRepetitiveGarminWorkoutStepTool } from "./generateRepetitiveGarminWorkoutStepTool";
import { generateSingleStepGarminWorkoutTool } from "./generateSingleStepGarminWorkoutTool";
import { generateGarminWorkoutSegmentTool } from "./generateGarminWorkoutSegmentTool";
import { generateGarminWorkoutTool } from "./generateGarminWorkoutTool";

export const garminWorkoutToolset = {
  buildGarminExerciseWorkoutTool: selectGarminExercisesWorkoutTool,
  getExerciseCategoriesTool: getExerciseCategoriesTool,
  getGarminExercises: getGarminExercises,
  generateSingleStepGarminWorkoutTool: generateSingleStepGarminWorkoutTool,
  generateRepetitiveGarminWorkoutStepTool:
    generateRepetitiveGarminWorkoutStepTool,
  generateGarminWorkoutSegmentTool: generateGarminWorkoutSegmentTool,
  generateGarminWorkoutTool: generateGarminWorkoutTool,
};
export type GarminWorkoutToolset = InferUITools<typeof garminWorkoutToolset>;
export type GarminWorkoutlCalls = InferUITools<typeof garminWorkoutToolset>;
export type GarminWorkoutResponses = InferUITools<typeof garminWorkoutToolset>;
