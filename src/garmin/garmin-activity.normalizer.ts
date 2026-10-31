
import {
    ActivityDto,
    GarminActivityPayload,
    } from './garmin.types';
    
    /**
     * Convert an optional numeric Garmin value into number | null.
     */
    function toNullableNumber(value: unknown): number | null {
        return typeof value === 'number' && Number.isFinite(value)
        ? value
        : null;
    }
  
    /**
     * Convert an optional string Garmin value into string | null.
     */
    function toNullableString(value: unknown): string | null {
        return typeof value === 'string' ? value : null;
    }
  
    /**
     * Normalize a validated Garmin activity payload into our internal DTO.
     *
     * This function assumes the payload has already passed
     * isGarminActivityPayload().
     */
    export function normalizeGarminActivity(
        payload: GarminActivityPayload,
    ): ActivityDto {
        const activityType = payload.activityType as {
        typeKey: string;
        };
  
    return {
        // Identity and activity information
        externalActivityId: String(payload.activityId),
        name: toNullableString(payload.activityName),
        sportType: activityType.typeKey,
    
        // Date and time
        startedAt: new Date(payload.beginTimestamp as number),
        sourceStartTimeLocal: toNullableString(payload.startTimeLocal),
    
        // Basic activity metrics
        distanceM: toNullableNumber(payload.distance),
        durationSeconds: toNullableNumber(payload.duration),
        movingDurationSeconds: toNullableNumber(payload.movingDuration),
    
        // Heart rate and cadence
        averageHr: toNullableNumber(payload.averageHR),
        maxHr: toNullableNumber(payload.maxHR),
        averageCadence: toNullableNumber(
            payload.averageRunningCadenceInStepsPerMinute,
        ),
    
        // Elevation and calories
        elevationGainM: toNullableNumber(payload.elevationGain),
        elevationLossM: toNullableNumber(payload.elevationLoss),
        calories: toNullableNumber(payload.calories),
    
        // Garmin Training Effect
        aerobicTrainingEffect: toNullableNumber(
            payload.aerobicTrainingEffect,
        ),
        anaerobicTrainingEffect: toNullableNumber(
            payload.anaerobicTrainingEffect,
        ),
        trainingEffectLabel: toNullableString(payload.trainingEffectLabel),
    
        // Heart rate time in zones
        hrTimeInZone1Seconds: toNullableNumber(payload.hrTimeInZone_1),
        hrTimeInZone2Seconds: toNullableNumber(payload.hrTimeInZone_2),
        hrTimeInZone3Seconds: toNullableNumber(payload.hrTimeInZone_3),
        hrTimeInZone4Seconds: toNullableNumber(payload.hrTimeInZone_4),
        hrTimeInZone5Seconds: toNullableNumber(payload.hrTimeInZone_5),
    
        // Running power
        averagePowerW: toNullableNumber(payload.avgPower),
        maxPowerW: toNullableNumber(payload.maxPower),
        normalizedPowerW: toNullableNumber(payload.normPower),
    
        // Running dynamics
        steps: toNullableNumber(payload.steps),
        avgGroundContactTimeMs: toNullableNumber(
            payload.avgGroundContactTime,
        ),
        avgStrideLengthCm: toNullableNumber(payload.avgStrideLength),
        avgVerticalOscillationCm: toNullableNumber(
            payload.avgVerticalOscillation,
        ),
        avgVerticalRatio: toNullableNumber(payload.avgVerticalRatio),
    
        // Additional running metrics
        maxRunningCadenceSpm: toNullableNumber(
            payload.maxRunningCadenceInStepsPerMinute,
        ),
        maxSpeedMps: toNullableNumber(payload.maxSpeed),
    };
}
  