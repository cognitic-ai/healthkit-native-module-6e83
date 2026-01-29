import { ScrollView, Text, Pressable, View, Alert } from "react-native";
import { useState, useEffect } from "react";
import * as HealthKit from "../../../modules/expo-healthkit";

export default function IndexRoute() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [stepCount, setStepCount] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [calories, setCalories] = useState<number | null>(null);
  const [heartRate, setHeartRate] = useState<number | null>(null);

  useEffect(() => {
    setIsAvailable(HealthKit.isAvailable());
  }, []);

  const requestPermissions = async () => {
    try {
      const granted = await HealthKit.requestAuthorization(
        ["stepCount", "heartRate", "distanceWalkingRunning", "activeEnergyBurned"],
        ["workoutType"]
      );
      if (granted) {
        Alert.alert("Success", "HealthKit permissions granted");
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to request permissions");
    }
  };

  const fetchTodayStats = async () => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [steps, dist, cals, hr] = await Promise.all([
        HealthKit.getStepCount(startOfDay, now),
        HealthKit.getDistanceWalkingRunning(startOfDay, now),
        HealthKit.getActiveEnergyBurned(startOfDay, now),
        HealthKit.getHeartRate(startOfDay, now, 1),
      ]);

      setStepCount(steps);
      setDistance(Math.round(dist));
      setCalories(Math.round(cals));
      setHeartRate(hr.length > 0 ? Math.round(hr[0].value) : null);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to fetch health data");
    }
  };

  const saveWorkout = async () => {
    try {
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      await HealthKit.writeWorkout(
        "running",
        thirtyMinutesAgo,
        now,
        250,
        5000
      );

      Alert.alert("Success", "Workout saved to HealthKit");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save workout");
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{
        padding: 16,
        backgroundColor: "#f5f5f5",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
        HealthKit Demo
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 24, color: "#666" }}>
        HealthKit Available: {isAvailable ? "Yes" : "No"}
      </Text>

      <View style={{ gap: 12 }}>
        <Pressable
          onPress={requestPermissions}
          style={{
            backgroundColor: "#007AFF",
            padding: 16,
            borderRadius: 12,
            borderCurve: "continuous",
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
            Request Permissions
          </Text>
        </Pressable>

        <Pressable
          onPress={fetchTodayStats}
          style={{
            backgroundColor: "#34C759",
            padding: 16,
            borderRadius: 12,
            borderCurve: "continuous",
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
            Fetch Today's Stats
          </Text>
        </Pressable>

        <Pressable
          onPress={saveWorkout}
          style={{
            backgroundColor: "#FF9500",
            padding: 16,
            borderRadius: 12,
            borderCurve: "continuous",
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
            Save Sample Workout
          </Text>
        </Pressable>
      </View>

      {(stepCount !== null || distance !== null || calories !== null || heartRate !== null) && (
        <View
          style={{
            marginTop: 32,
            padding: 16,
            backgroundColor: "white",
            borderRadius: 12,
            borderCurve: "continuous",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
            Today's Stats
          </Text>

          {stepCount !== null && (
            <View>
              <Text style={{ fontSize: 14, color: "#666" }}>Steps</Text>
              <Text style={{ fontSize: 32, fontWeight: "bold", fontVariant: "tabular-nums" }}>
                {stepCount.toLocaleString()}
              </Text>
            </View>
          )}

          {distance !== null && (
            <View>
              <Text style={{ fontSize: 14, color: "#666" }}>Distance (meters)</Text>
              <Text style={{ fontSize: 32, fontWeight: "bold", fontVariant: "tabular-nums" }}>
                {distance.toLocaleString()}
              </Text>
            </View>
          )}

          {calories !== null && (
            <View>
              <Text style={{ fontSize: 14, color: "#666" }}>Active Calories</Text>
              <Text style={{ fontSize: 32, fontWeight: "bold", fontVariant: "tabular-nums" }}>
                {calories.toLocaleString()}
              </Text>
            </View>
          )}

          {heartRate !== null && (
            <View>
              <Text style={{ fontSize: 14, color: "#666" }}>Latest Heart Rate</Text>
              <Text style={{ fontSize: 32, fontWeight: "bold", fontVariant: "tabular-nums" }}>
                {heartRate} bpm
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
