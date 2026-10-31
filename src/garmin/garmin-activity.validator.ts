
import { GarminActivityPayload } from './garmin.types';

/**
 * Checks whether a value is a plain object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    );
}

/**
 * Required string fields must contain non-empty strings.
 */
function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Required numeric fields must be finite numbers.
 */
function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Optional numeric fields may be absent or null.
 * If provided, they must contain finite numbers.
 */
function isOptionalNumber(value: unknown): boolean {
    return value === undefined || value === null || isFiniteNumber(value);
}

/**
 * Optional integer fields may be absent or null.
 * If provided, they must contain finite integers.
 */
function isOptionalInteger(value: unknown): boolean {
    return (
        value === undefined ||
        value === null ||
        (isFiniteNumber(value) && Number.isInteger(value))
    );
}

/**
 * Optional string fields may be absent or null.
 */
function isOptionalString(value: unknown): boolean {
    return (
        value === undefined ||
        value === null ||
        typeof value === 'string'
    );
}

/**
 * Validates the minimum required structure of a Garmin activity payload.
 *
 * Invalid core fields reject the activity.
 * Invalid optional fields also reject the payload rather than silently
 * converting corrupted values into null.
 */
export function isGarminActivityPayload(
    value: unknown,
): value is GarminActivityPayload {
    if (!isRecord(value)) {
        return false;
    }

  // Required: activity ID
    const validActivityId =
        (typeof value.activityId === 'string' &&
        value.activityId.trim().length > 0) ||
        (isFiniteNumber(value.activityId) && Number.isInteger(value.activityId));

    if (!validActivityId) {
        return false;
    }

    // Required: activity type and typeKey
    if (
        !isRecord(value.activityType) ||
        !isNonEmptyString(value.activityType.typeKey)
    ) {
        return false;
    }

    // Required: timestamp in milliseconds
    if (!isFiniteNumber(value.beginTimestamp)) {
        return false;
    }

    const startedAt = new Date(value.beginTimestamp);

    if (Number.isNaN(startedAt.getTime())) {
        return false;
    }

    // Optional string fields
    const validStrings = [
        value.activityName,
        value.startTimeLocal,
        value.startTimeGMT,
        value.trainingEffectLabel,
    ].every(isOptionalString);

    if (!validStrings) {
        return false;
    }

    // Optional numeric fields
    const numericFields = [
        value.distance,
        value.duration,
        value.movingDuration,
        value.averageHR,
        value.averageRunningCadenceInStepsPerMinute,
        value.elevationGain,
        value.elevationLoss,
        value.aerobicTrainingEffect,
        value.anaerobicTrainingEffect,
        value.hrTimeInZone_1,
        value.hrTimeInZone_2,
        value.hrTimeInZone_3,
        value.hrTimeInZone_4,
        value.hrTimeInZone_5,
        value.avgPower,
        value.maxPower,
        value.normPower,
        value.avgGroundContactTime,
        value.avgStrideLength,
        value.avgVerticalOscillation,
        value.avgVerticalRatio,
        value.maxSpeed,
    ];

    if (!numericFields.every(isOptionalNumber)) {
        return false;
    }

    // Optional integer fields mapped to Prisma Int columns
    const integerFields = [
        value.maxHR,
        value.maxRunningCadenceInStepsPerMinute,
        value.calories,
        value.steps,
    ];

    if (!integerFields.every(isOptionalInteger)) {
        return false;
    }

    return true;
}