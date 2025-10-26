import { tool } from "ai";
import { z } from "zod";
import { convertPaceToMetersPerSecond } from "../utils/convertPaceToMetersPerSecond";

export const convertPaceTool = tool({
  name: "convertPaceToMetersPerSecond",
  description:
    "Converts a running pace to meters per second. Supports pace in minutes per mile, minutes per kilometer, or direct meters per second.",
  inputSchema: z.object({
    pace: z
      .string()
      .describe(
        'The pace value (e.g., "7:20" for 7 minutes 20 seconds per mile/km, or "3.5" for meters/second)'
      ),
    unit: z
      .enum(["miles", "km", "meters/second"])
      .describe(
        "The unit of the pace: 'miles' for min/mile, 'km' for min/km, or 'meters/second' for m/s"
      ),
  }),
  outputSchema: z.object({
    metersPerSecond: z
      .number()
      .describe("The calculated speed in meters per second"),
  }),
  execute: async ({ pace, unit }) => {
    const metersPerSecond = convertPaceToMetersPerSecond(pace, unit);
    return { metersPerSecond };
  },
});
