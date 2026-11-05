import {
    MetricActivityInput,
    MetricsPeriodType,
    PeriodMetrics,
} from './metrics.types';

import { filterEligibleRunningActivities } from './metrics.eligibility';

import {
    calculateRunningPhysiologyMetrics,
    calculateRunningVolumeMetrics,
} from './metrics.calculator';

import { getPeriodKey } from './metrics.period';

export function aggregateActivitiesByPeriod(
    activities: MetricActivityInput[],
    periodType: MetricsPeriodType,
): PeriodMetrics[] {
    const { eligibleActivities } =
      filterEligibleRunningActivities(activities);

    const groupedActivities = new Map<string, MetricActivityInput[]>();

    for (const activity of eligibleActivities) {
      if (!activity.startedAt) {
        continue;
      }

      const periodKey = getPeriodKey(activity.startedAt, periodType);

      if (!periodKey) {
        continue;
      }

      const existingActivities = groupedActivities.get(periodKey) ?? [];

      existingActivities.push(activity);

      groupedActivities.set(periodKey, existingActivities);
    }

    const result: PeriodMetrics[] = [];

    for (const [periodKey, periodActivities] of groupedActivities) {
      const volumeMetrics =
        calculateRunningVolumeMetrics(periodActivities);

      const physiologyMetrics =
        calculateRunningPhysiologyMetrics(periodActivities);

      const longestRunDistanceM = Math.max(
        ...periodActivities.map((activity) => activity.distanceM as number),
      );

      result.push({
        periodType,
        periodKey,
        activityCount: volumeMetrics.activityCount,
        totalDistanceKm: volumeMetrics.totalDistanceKm,
        totalDurationSeconds: volumeMetrics.totalDurationSeconds,
        totalMovingDurationSeconds:
          volumeMetrics.totalMovingDurationSeconds,
        averagePaceSecondsPerKm:
          volumeMetrics.averagePaceSecondsPerKm,
        averageMovingPaceSecondsPerKm:
          volumeMetrics.averageMovingPaceSecondsPerKm,
        longestRunDistanceKm: longestRunDistanceM / 1000,
        averageHr: physiologyMetrics.averageHr,
        maxHr: physiologyMetrics.maxHr,
        averageCadence: physiologyMetrics.averageCadence,
        totalElevationGainM: physiologyMetrics.totalElevationGainM,
      });
    }

    return result.sort((a, b) =>
      a.periodKey.localeCompare(b.periodKey),
    );
}