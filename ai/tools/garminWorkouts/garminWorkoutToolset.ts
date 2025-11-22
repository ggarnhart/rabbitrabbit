import { InferUITools } from "ai";
import { buildGarminExerciseWorkoutTool } from "./buildGarminExerciseWorkoutTool";
import { getExerciseCategoriesTool } from "./getExerciseCategories";
import { getGarminExercises } from "./getGarminExercises";

export const garminWorkoutToolset = {
  buildGarminExerciseWorkoutTool: buildGarminExerciseWorkoutTool,
  getExerciseCategoriesTool: getExerciseCategoriesTool,
  getGarminExercises: getGarminExercises,
};
export type GarminWorkoutToolset = InferUITools<typeof garminWorkoutToolset>;
export type GarminWorkoutlCalls = InferUITools<typeof garminWorkoutToolset>;
export type GarminWorkoutResponses = InferUITools<typeof garminWorkoutToolset>;
