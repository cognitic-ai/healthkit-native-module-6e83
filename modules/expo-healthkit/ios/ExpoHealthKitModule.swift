import ExpoModulesCore
import HealthKit

public class ExpoHealthKitModule: Module {
  private let healthStore = HKHealthStore()

  public func definition() -> ModuleDefinition {
    Name("ExpoHealthKit")

    // Check if HealthKit is available
    Function("isAvailable") { () -> Bool in
      return HKHealthStore.isHealthDataAvailable()
    }

    // Request authorization
    AsyncFunction("requestAuthorization") { (readTypes: [String], writeTypes: [String], promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable() else {
        promise.reject("HEALTHKIT_UNAVAILABLE", "HealthKit is not available on this device")
        return
      }

      let readTypeSet = Set(readTypes.compactMap { self.getHealthKitType(for: $0) })
      let writeTypeSet = Set(writeTypes.compactMap { self.getHealthKitType(for: $0) })

      self.healthStore.requestAuthorization(toShare: writeTypeSet, read: readTypeSet) { success, error in
        if let error = error {
          promise.reject("AUTHORIZATION_ERROR", error.localizedDescription)
        } else {
          promise.resolve(success)
        }
      }
    }

    // Get step count
    AsyncFunction("getStepCount") { (startDate: Double, endDate: Double, promise: Promise) in
      guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
        promise.reject("INVALID_TYPE", "Step count type is not available")
        return
      }

      let start = Date(timeIntervalSince1970: startDate)
      let end = Date(timeIntervalSince1970: endDate)
      let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)

      let query = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
        if let error = error {
          promise.reject("QUERY_ERROR", error.localizedDescription)
          return
        }

        guard let result = result, let sum = result.sumQuantity() else {
          promise.resolve(0)
          return
        }

        let steps = sum.doubleValue(for: HKUnit.count())
        promise.resolve(Int(steps))
      }

      self.healthStore.execute(query)
    }

    // Get heart rate samples
    AsyncFunction("getHeartRate") { (startDate: Double, endDate: Double, limit: Int, promise: Promise) in
      guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
        promise.reject("INVALID_TYPE", "Heart rate type is not available")
        return
      }

      let start = Date(timeIntervalSince1970: startDate)
      let end = Date(timeIntervalSince1970: endDate)
      let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
      let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

      let query = HKSampleQuery(sampleType: heartRateType, predicate: predicate, limit: limit, sortDescriptors: [sortDescriptor]) { _, samples, error in
        if let error = error {
          promise.reject("QUERY_ERROR", error.localizedDescription)
          return
        }

        guard let samples = samples as? [HKQuantitySample] else {
          promise.resolve([])
          return
        }

        let results = samples.map { sample -> [String: Any] in
          return [
            "value": sample.quantity.doubleValue(for: HKUnit(from: "count/min")),
            "startDate": sample.startDate.timeIntervalSince1970,
            "endDate": sample.endDate.timeIntervalSince1970
          ]
        }

        promise.resolve(results)
      }

      self.healthStore.execute(query)
    }

    // Get distance walking/running
    AsyncFunction("getDistanceWalkingRunning") { (startDate: Double, endDate: Double, promise: Promise) in
      guard let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning) else {
        promise.reject("INVALID_TYPE", "Distance type is not available")
        return
      }

      let start = Date(timeIntervalSince1970: startDate)
      let end = Date(timeIntervalSince1970: endDate)
      let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)

      let query = HKStatisticsQuery(quantityType: distanceType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
        if let error = error {
          promise.reject("QUERY_ERROR", error.localizedDescription)
          return
        }

        guard let result = result, let sum = result.sumQuantity() else {
          promise.resolve(0.0)
          return
        }

        let distance = sum.doubleValue(for: HKUnit.meter())
        promise.resolve(distance)
      }

      self.healthStore.execute(query)
    }

    // Get active energy burned
    AsyncFunction("getActiveEnergyBurned") { (startDate: Double, endDate: Double, promise: Promise) in
      guard let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) else {
        promise.reject("INVALID_TYPE", "Active energy type is not available")
        return
      }

      let start = Date(timeIntervalSince1970: startDate)
      let end = Date(timeIntervalSince1970: endDate)
      let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)

      let query = HKStatisticsQuery(quantityType: energyType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
        if let error = error {
          promise.reject("QUERY_ERROR", error.localizedDescription)
          return
        }

        guard let result = result, let sum = result.sumQuantity() else {
          promise.resolve(0.0)
          return
        }

        let energy = sum.doubleValue(for: HKUnit.kilocalorie())
        promise.resolve(energy)
      }

      self.healthStore.execute(query)
    }

    // Write workout
    AsyncFunction("writeWorkout") { (activityType: String, startDate: Double, endDate: Double, totalEnergyBurned: Double?, totalDistance: Double?, promise: Promise) in
      let start = Date(timeIntervalSince1970: startDate)
      let end = Date(timeIntervalSince1970: endDate)

      guard let activity = self.getWorkoutActivityType(for: activityType) else {
        promise.reject("INVALID_ACTIVITY", "Invalid workout activity type")
        return
      }

      var energy: HKQuantity?
      if let calories = totalEnergyBurned {
        energy = HKQuantity(unit: HKUnit.kilocalorie(), doubleValue: calories)
      }

      var distance: HKQuantity?
      if let meters = totalDistance {
        distance = HKQuantity(unit: HKUnit.meter(), doubleValue: meters)
      }

      let workout = HKWorkout(activityType: activity, start: start, end: end, duration: end.timeIntervalSince(start), totalEnergyBurned: energy, totalDistance: distance, metadata: nil)

      self.healthStore.save(workout) { success, error in
        if let error = error {
          promise.reject("SAVE_ERROR", error.localizedDescription)
        } else {
          promise.resolve(success)
        }
      }
    }
  }

  // Helper function to get HealthKit type from string
  private func getHealthKitType(for identifier: String) -> HKObjectType? {
    switch identifier {
    case "stepCount":
      return HKQuantityType.quantityType(forIdentifier: .stepCount)
    case "heartRate":
      return HKQuantityType.quantityType(forIdentifier: .heartRate)
    case "distanceWalkingRunning":
      return HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)
    case "activeEnergyBurned":
      return HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)
    case "workoutType":
      return HKObjectType.workoutType()
    default:
      return nil
    }
  }

  // Helper function to get workout activity type
  private func getWorkoutActivityType(for type: String) -> HKWorkoutActivityType? {
    switch type {
    case "running":
      return .running
    case "walking":
      return .walking
    case "cycling":
      return .cycling
    case "swimming":
      return .swimming
    case "yoga":
      return .yoga
    case "functionalStrengthTraining":
      return .functionalStrengthTraining
    case "traditionalStrengthTraining":
      return .traditionalStrengthTraining
    case "hiking":
      return .hiking
    default:
      return nil
    }
  }
}
