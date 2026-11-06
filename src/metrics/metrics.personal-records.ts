import {
    PERSONAL_RECORD_TARGETS,
    PERSONAL_RECORD_TOLERANCE,
  } from './metrics.constants';

  import { filterEligibleRunningActivities } from './metrics.eligibility';

  import {
    PersonalRecordActivityInput,
    PersonalRecordEntry,
    PersonalRecordResult,
  } from './metrics.types';

  function normalizeStartedAt(
    value: Date | string | null | undefined,
  ): string | null {
    if (value == null) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function comparePersonalRecords(
    left: PersonalRecordEntry,
    right: PersonalRecordEntry,
  ): number {
    if (left.durationSeconds !== right.durationSeconds) {
      return left.durationSeconds - right.durationSeconds;
    }

    const leftTime = left.startedAt
      ? new Date(left.startedAt).getTime()
      : null;

    const rightTime = right.startedAt
      ? new Date(right.startedAt).getTime()
      : null;

    if (leftTime !== rightTime) {
      if (leftTime === null) return 1;
      if (rightTime === null) return -1;

      return leftTime - rightTime;
    }

    if (left.activityId < right.activityId) return -1;
    if (left.activityId > right.activityId) return 1;

    return 0;
  }

  export function calculatePersonalRecords(
    activities: PersonalRecordActivityInput[],
  ): PersonalRecordResult[] {
    const { eligibleActivities } =
      filterEligibleRunningActivities(activities);

    return PERSONAL_RECORD_TARGETS.map((target) => {
      const minDistanceM =
        target.distanceM * (1 - PERSONAL_RECORD_TOLERANCE);

      const maxDistanceM =
        target.distanceM * (1 + PERSONAL_RECORD_TOLERANCE);

      const candidates: PersonalRecordEntry[] = [];

      for (const activity of eligibleActivities) {
        const activityId = activity.id;

        if (!activityId) {
          continue;
        }

        const distanceM = activity.distanceM as number;
        const durationSeconds = activity.durationSeconds as number;

        if (distanceM < minDistanceM || distanceM > maxDistanceM) {
          continue;
        }

        candidates.push({
          activityId,
          distanceM,
          durationSeconds,
          startedAt: normalizeStartedAt(activity.startedAt),
        });
      }

      candidates.sort(comparePersonalRecords);

      return {
        key: target.key,
        label: target.label,
        targetDistanceM: target.distanceM,
        minDistanceM,
        maxDistanceM,
        record: candidates[0] ?? null,
      };
    });
  }