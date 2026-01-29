# Expo HealthKit Module

A native module for accessing HealthKit data in your Expo iOS app.

## Features

- Check HealthKit availability
- Request permissions for reading and writing health data
- Read step count, heart rate, distance, and active calories
- Write workout data to HealthKit

## Setup

The module is already configured in your app. Make sure you have the HealthKit entitlements and Info.plist keys set in `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSHealthShareUsageDescription": "This app needs access to your health data",
        "NSHealthUpdateUsageDescription": "This app needs permission to save workout data"
      },
      "entitlements": {
        "com.apple.developer.healthkit": true
      }
    }
  }
}
```

## Usage

```typescript
import * as HealthKit from "./modules/expo-healthkit";

// Check if HealthKit is available
const available = HealthKit.isAvailable();

// Request permissions
await HealthKit.requestAuthorization(
  ["stepCount", "heartRate", "distanceWalkingRunning", "activeEnergyBurned"],
  ["workoutType"]
);

// Get today's step count
const now = new Date();
const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const steps = await HealthKit.getStepCount(startOfDay, now);

// Get heart rate samples
const heartRates = await HealthKit.getHeartRate(startOfDay, now, 10);

// Get distance walking/running (in meters)
const distance = await HealthKit.getDistanceWalkingRunning(startOfDay, now);

// Get active energy burned (in kilocalories)
const calories = await HealthKit.getActiveEnergyBurned(startOfDay, now);

// Write a workout
await HealthKit.writeWorkout(
  "running",
  new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  new Date(),
  250, // calories burned
  5000 // distance in meters
);
```

## API

### `isAvailable(): boolean`

Returns whether HealthKit is available on the device.

### `requestAuthorization(readTypes: HealthKitPermission[], writeTypes: HealthKitPermission[]): Promise<boolean>`

Requests permission to read and write health data.

**Permission types:**
- `stepCount`
- `heartRate`
- `distanceWalkingRunning`
- `activeEnergyBurned`
- `workoutType`

### `getStepCount(startDate: Date, endDate: Date): Promise<number>`

Gets the total step count for a date range.

### `getHeartRate(startDate: Date, endDate: Date, limit: number): Promise<HeartRateSample[]>`

Gets heart rate samples for a date range.

### `getDistanceWalkingRunning(startDate: Date, endDate: Date): Promise<number>`

Gets the total walking/running distance in meters.

### `getActiveEnergyBurned(startDate: Date, endDate: Date): Promise<number>`

Gets the total active energy burned in kilocalories.

### `writeWorkout(activityType: WorkoutActivityType, startDate: Date, endDate: Date, totalEnergyBurned?: number, totalDistance?: number): Promise<boolean>`

Writes a workout to HealthKit.

**Activity types:**
- `running`
- `walking`
- `cycling`
- `swimming`
- `yoga`
- `functionalStrengthTraining`
- `traditionalStrengthTraining`
- `hiking`

## Important Notes

- HealthKit is only available on iOS devices (not simulator in some cases)
- You must request permissions before accessing health data
- The app needs to be built with a development or production build (not Expo Go) to test HealthKit functionality
- Make sure your Apple Developer account has HealthKit capability enabled
