import { requireNativeModule } from 'expo-modules-core';

export interface HeartRateSample {
  value: number;
  startDate: number;
  endDate: number;
}

export type HealthKitPermission =
  | 'stepCount'
  | 'heartRate'
  | 'distanceWalkingRunning'
  | 'activeEnergyBurned'
  | 'workoutType';

export type WorkoutActivityType =
  | 'running'
  | 'walking'
  | 'cycling'
  | 'swimming'
  | 'yoga'
  | 'functionalStrengthTraining'
  | 'traditionalStrengthTraining'
  | 'hiking';

const ExpoHealthKitModule = requireNativeModule('ExpoHealthKit');

/**
 * Check if HealthKit is available on the device
 */
export function isAvailable(): boolean {
  return ExpoHealthKitModule.isAvailable();
}

/**
 * Request authorization to access HealthKit data
 * @param readTypes Array of data types to read (e.g., ['stepCount', 'heartRate'])
 * @param writeTypes Array of data types to write (e.g., ['workoutType'])
 */
export async function requestAuthorization(
  readTypes: HealthKitPermission[] = [],
  writeTypes: HealthKitPermission[] = []
): Promise<boolean> {
  return await ExpoHealthKitModule.requestAuthorization(readTypes, writeTypes);
}

/**
 * Get step count for a date range
 * @param startDate Start date timestamp (milliseconds)
 * @param endDate End date timestamp (milliseconds)
 */
export async function getStepCount(
  startDate: Date,
  endDate: Date
): Promise<number> {
  return await ExpoHealthKitModule.getStepCount(
    startDate.getTime() / 1000,
    endDate.getTime() / 1000
  );
}

/**
 * Get heart rate samples for a date range
 * @param startDate Start date timestamp (milliseconds)
 * @param endDate End date timestamp (milliseconds)
 * @param limit Maximum number of samples to return
 */
export async function getHeartRate(
  startDate: Date,
  endDate: Date,
  limit: number = 100
): Promise<HeartRateSample[]> {
  const samples = await ExpoHealthKitModule.getHeartRate(
    startDate.getTime() / 1000,
    endDate.getTime() / 1000,
    limit
  );
  return samples.map((sample: any) => ({
    value: sample.value,
    startDate: sample.startDate * 1000,
    endDate: sample.endDate * 1000,
  }));
}

/**
 * Get distance walking/running for a date range (in meters)
 * @param startDate Start date timestamp (milliseconds)
 * @param endDate End date timestamp (milliseconds)
 */
export async function getDistanceWalkingRunning(
  startDate: Date,
  endDate: Date
): Promise<number> {
  return await ExpoHealthKitModule.getDistanceWalkingRunning(
    startDate.getTime() / 1000,
    endDate.getTime() / 1000
  );
}

/**
 * Get active energy burned for a date range (in kilocalories)
 * @param startDate Start date timestamp (milliseconds)
 * @param endDate End date timestamp (milliseconds)
 */
export async function getActiveEnergyBurned(
  startDate: Date,
  endDate: Date
): Promise<number> {
  return await ExpoHealthKitModule.getActiveEnergyBurned(
    startDate.getTime() / 1000,
    endDate.getTime() / 1000
  );
}

/**
 * Write a workout to HealthKit
 * @param activityType Type of workout activity
 * @param startDate Start date timestamp
 * @param endDate End date timestamp
 * @param totalEnergyBurned Total energy burned in kilocalories (optional)
 * @param totalDistance Total distance in meters (optional)
 */
export async function writeWorkout(
  activityType: WorkoutActivityType,
  startDate: Date,
  endDate: Date,
  totalEnergyBurned?: number,
  totalDistance?: number
): Promise<boolean> {
  return await ExpoHealthKitModule.writeWorkout(
    activityType,
    startDate.getTime() / 1000,
    endDate.getTime() / 1000,
    totalEnergyBurned,
    totalDistance
  );
}
