import { tool } from "ai";
import { CreateWorkoutSchema } from "./workoutSchema";
import { saveWorkout } from "@/app/workouts/data/saveWorkout";

export const saveToGarminTool = tool({
  name: "saveToGarmin",
  inputSchema: CreateWorkoutSchema,
  description:
    "Saves the generated workout to the user's Garmin Account. After completion, let the user know you've created the workout. Compatible with all Garmin Workouts, running and strength included.",
  execute: async (workout) => {
    await saveWorkout(workout, workout.conversationId, true);
  },
});
