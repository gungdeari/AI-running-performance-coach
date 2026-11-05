import { METERS_PER_KILOMETER } from './metrics.constants';
import { isValidNonNegativeNumber } from './metrics.validation';
import { RunningPhysiologyMetrics } from './metrics.types';

import {
    ActivityPaceMetrics,
    MetricActivityInput,
    RunningVolumeMetrics,
} from './metrics.types';

import { filterEligibleRunningActivities } from './metrics.eligibility';

import {
    isValidPositiveNumber,
} from './metrics.validation';

export function calculateActivityPace(
    activity: MetricActivityInput,
): ActivityPaceMetrics | null {
    if (
        !isValidPositiveNumber(activity.distanceM) ||
        !isValidPositiveNumber(activity.durationSeconds)
    ) {
        return null;
    }

    const distanceKm =
        activity.distanceM / METERS_PER_KILOMETER;

    const averagePaceSecondsPerKm =
        activity.durationSeconds / distanceKm;

    const hasValidMovingDuration =
        isValidPositiveNumber(activity.movingDurationSeconds);

    const movingDurationSeconds =
        isValidPositiveNumber(activity.movingDurationSeconds)
            ? activity.movingDurationSeconds
            : null;

    const movingPaceSecondsPerKm =
        movingDurationSeconds !== null
            ? movingDurationSeconds / distanceKm
            : null;

    return {
        distanceKm,
        durationSeconds: activity.durationSeconds,
        movingDurationSeconds,
        averagePaceSecondsPerKm,
        movingPaceSecondsPerKm,
    };
}

export function calculateRunningVolumeMetrics(
    activities: MetricActivityInput[],
): RunningVolumeMetrics {
    const { eligibleActivities } =
        filterEligibleRunningActivities(activities);

    if (eligibleActivities.length === 0) {
        return {
        activityCount: 0,
        totalDistanceKm: null,
        totalDurationSeconds: null,
        totalMovingDurationSeconds: null,
        averagePaceSecondsPerKm: null,
        averageMovingPaceSecondsPerKm: null,
        };
    }

    let totalDistanceM = 0;
    let totalDurationSeconds = 0;

    let movingDistanceM = 0;
    let totalMovingDurationSeconds = 0;
    let movingDurationActivityCount = 0;

    for (const activity of eligibleActivities) {
        // Eligibility has already validated these two fields.
        const distanceM = activity.distanceM as number;
        const durationSeconds = activity.durationSeconds as number;

        totalDistanceM += distanceM;
        totalDurationSeconds += durationSeconds;

        const movingDurationSeconds =
            activity.movingDurationSeconds;

        if (isValidPositiveNumber(movingDurationSeconds)) {
            movingDistanceM += distanceM;
            totalMovingDurationSeconds += movingDurationSeconds;
            movingDurationActivityCount += 1;
        }
    }

    const totalDistanceKm =
        totalDistanceM / METERS_PER_KILOMETER;

    const averagePaceSecondsPerKm =
        totalDurationSeconds / totalDistanceKm;

    const hasMovingDuration =
        movingDurationActivityCount > 0;

    const totalMovingDistanceKm =
        movingDistanceM / METERS_PER_KILOMETER;

    return {
        activityCount: eligibleActivities.length,
        totalDistanceKm,
        totalDurationSeconds,
        totalMovingDurationSeconds: hasMovingDuration
        ? totalMovingDurationSeconds
        : null,
        averagePaceSecondsPerKm,
        averageMovingPaceSecondsPerKm: hasMovingDuration
        ? totalMovingDurationSeconds / totalMovingDistanceKm
        : null,
    };
}

export function calculateRunningPhysiologyMetrics(
    activities: MetricActivityInput[],
  ): RunningPhysiologyMetrics {
    const { eligibleActivities } = filterEligibleRunningActivities(activities);

    let hrWeightedSum = 0;
    let hrTotalDuration = 0;

    let cadenceWeightedSum = 0;
    let cadenceTotalDuration = 0;

    let maxHr: number | null = null;

    let totalElevationGainM = 0;
    let elevationActivityCount = 0;

    for (const activity of eligibleActivities) {
      const durationSeconds = activity.durationSeconds;

      if (!isValidPositiveNumber(durationSeconds)) {
        continue;
      }

      // Average HR: duration-weighted
      if (isValidPositiveNumber(activity.averageHr)) {
        hrWeightedSum += activity.averageHr * durationSeconds;
        hrTotalDuration += durationSeconds;
      }

      // Max HR: maximum valid value
      if (isValidPositiveNumber(activity.maxHr)) {
        maxHr =
          maxHr === null
            ? activity.maxHr
            : Math.max(maxHr, activity.maxHr);
      }

      // Average cadence: duration-weighted
      if (isValidPositiveNumber(activity.averageCadence)) {
        cadenceWeightedSum +=
          activity.averageCadence * durationSeconds;
        cadenceTotalDuration += durationSeconds;
      }

      // Elevation gain: sum available non-negative values
      if (isValidNonNegativeNumber(activity.elevationGainM)) {
        totalElevationGainM += activity.elevationGainM;
        elevationActivityCount += 1;
      }
    }

    return {
      averageHr:
        hrTotalDuration > 0
          ? hrWeightedSum / hrTotalDuration
          : null,

      maxHr,

      averageCadence:
        cadenceTotalDuration > 0
          ? cadenceWeightedSum / cadenceTotalDuration
          : null,

      totalElevationGainM:
        elevationActivityCount > 0
          ? totalElevationGainM
          : null,
    };
  }