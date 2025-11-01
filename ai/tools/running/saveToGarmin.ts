import { tool } from "ai";
import { CreateWorkoutSchema } from "./workoutSchema";
import { saveWorkout } from "@/app/workouts/data/saveWorkout";

export const saveToGarminTool = tool({
  name: "saveToGarmin",
  inputSchema: CreateWorkoutSchema,
  description:
    "Saves the generated running workout to the user's Garmin Account.",
  execute: async (workout) => {
    saveWorkout(workout, true);
  },
});
