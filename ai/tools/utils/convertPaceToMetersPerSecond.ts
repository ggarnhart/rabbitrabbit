type PaceUnit = "miles" | "km" | "meters/second";

/**
 * Converts a pace to meters per second
 * @param pace - The pace value (e.g., "7:20" for min:sec format, or "3.5" for meters/second)
 * @param unit - The unit of the pace
 * @returns The speed in meters per second
 */
export function convertPaceToMetersPerSecond(
  pace: string,
  unit: PaceUnit
): {
  goalPace: number;
  targetValueLow: number;
  targetValueHigh: number;
} {
  if (unit === "meters/second") {
    return {
      goalPace: parseFloat(pace),
      targetValueLow: parseFloat(pace) - 0.05,
      targetValueHigh: parseFloat(pace) + 0.05,
    };
  }

  // Parse the pace in min:sec format (e.g., "7:20" or "5:00")
  const parts = pace.split(":");
  const minutes = parseInt(parts[0], 10);
  const seconds = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  const totalSeconds = minutes * 60 + seconds;
  const fifteenSecondsFaster = totalSeconds - 15;
  const fifteenSecondsSlower = totalSeconds + 15;

  if (totalSeconds <= 0) {
    throw new Error("Pace cannot be zero");
  }

  // Calculate meters per second based on unit
  let metersPerUnit: number;

  if (unit === "miles") {
    metersPerUnit = 1609.34; // 1 mile in meters
  } else if (unit === "km") {
    metersPerUnit = 1000; // 1 km in meters
  } else {
    throw new Error(`Unsupported unit: ${unit}`);
  }

  // Pace is time per distance, so speed = distance / time
  return {
    goalPace: metersPerUnit / totalSeconds,
    targetValueLow: metersPerUnit / fifteenSecondsFaster,
    targetValueHigh: metersPerUnit / fifteenSecondsSlower,
  };
}
