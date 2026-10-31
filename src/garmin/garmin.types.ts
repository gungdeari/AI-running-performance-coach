/**
 * Raw activity payload received from Garmin Personal API.
 *
 * External values are typed as unknown intentionally.
 * They must pass runtime validation before normalization.
 */
export interface GarminActivityPayload {
    activityId?: unknown;
    activityName?: unknown;
  
    startTimeLocal?: unknown;
    startTimeGMT?: unknown;
    beginTimestamp?: unknown;
  
    activityType?: unknown;
  
    distance?: unknown;
    duration?: unknown;
    movingDuration?: unknown;
  
    averageHR?: unknown;
    maxHR?: unknown;
    averageRunningCadenceInStepsPerMinute?: unknown;
    maxRunningCadenceInStepsPerMinute?: unknown;
  
    elevationGain?: unknown;
    elevationLoss?: unknown;
    calories?: unknown;
  
    aerobicTrainingEffect?: unknown;
    anaerobicTrainingEffect?: unknown;
    trainingEffectLabel?: unknown;
  
    hrTimeInZone_1?: unknown;
    hrTimeInZone_2?: unknown;
    hrTimeInZone_3?: unknown;
    hrTimeInZone_4?: unknown;
    hrTimeInZone_5?: unknown;
  
    avgPower?: unknown;
    maxPower?: unknown;
    normPower?: unknown;
  
    steps?: unknown;
    avgGroundContactTime?: unknown;
    avgStrideLength?: unknown;
    avgVerticalOscillation?: unknown;
    avgVerticalRatio?: unknown;
  
    maxSpeed?: unknown;
  }
  
  /**
   * Normalized activity representation used internally by our backend.
   *
   * Independent from Garmin's original field names.
   */
  export interface ActivityDto {
    externalActivityId: string;
    name: string | null;
    sportType: string;
  
    startedAt: Date;
    sourceStartTimeLocal: string | null;
  
    distanceM: number | null;
    durationSeconds: number | null;
    movingDurationSeconds: number | null;
  
    averageHr: number | null;
    maxHr: number | null;
    averageCadence: number | null;
  
    elevationGainM: number | null;
    elevationLossM: number | null;
    calories: number | null;
  
    aerobicTrainingEffect: number | null;
    anaerobicTrainingEffect: number | null;
    trainingEffectLabel: string | null;
  
    hrTimeInZone1Seconds: number | null;
    hrTimeInZone2Seconds: number | null;
    hrTimeInZone3Seconds: number | null;
    hrTimeInZone4Seconds: number | null;
    hrTimeInZone5Seconds: number | null;
  
    averagePowerW: number | null;
    maxPowerW: number | null;
    normalizedPowerW: number | null;
  
    steps: number | null;
    avgGroundContactTimeMs: number | null;
    avgStrideLengthCm: number | null;
    avgVerticalOscillationCm: number | null;
    avgVerticalRatio: number | null;
  
    maxRunningCadenceSpm: number | null;
    maxSpeedMps: number | null;
}