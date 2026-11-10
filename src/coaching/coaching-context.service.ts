import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import {
  aggregateActivitiesByPeriod,
} from '../metrics/metrics.aggregation';

import { comparePeriods } from '../metrics/metrics.comparison';

import {
  filterEligibleRunningActivities,
} from '../metrics/metrics.eligibility';

import {
  calculatePersonalRecords,
} from '../metrics/metrics.personal-records';

import { getPeriodKey } from '../metrics/metrics.period';

import type {
  MetricActivityInput,
  PersonalRecordActivityInput,
} from '../metrics/metrics.types';

import {
  COACHING_MINIMUM_RECENT_ACTIVITIES,
  COACHING_TIMEZONE,
} from './coaching.constants';

import type {
  CoachingContext,
  CoachingLimitation,
} from './coaching.types';

function shiftWeekKey(key: string, weeks: number): string {
  const date = new Date(`${key}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + weeks * 7);

  return date.toISOString().slice(0, 10);
}

function getLocalWeekStart(key: string): Date {
  return new Date(`${key}T00:00:00+08:00`);
}

@Injectable()
export class CoachingContextService {
  constructor(private readonly prisma: PrismaService) {}

  async buildContext(
    userId: string,
    now: Date = new Date(),
  ): Promise<CoachingContext> {
    if (!userId.trim()) {
      throw new RangeError('User ID is required');
    }

    if (Number.isNaN(now.getTime())) {
      throw new RangeError('Invalid reference date');
    }

    const currentWeekKey = getPeriodKey(now, 'weekly');

    if (!currentWeekKey) {
      throw new RangeError('Unable to determine current week');
    }

    const completedWeekKey = shiftWeekKey(currentWeekKey, -1);
    const previousWeekKey = shiftWeekKey(currentWeekKey, -2);

    const recentStart = getLocalWeekStart(previousWeekKey);

    const records = await this.prisma.activity.findMany({
      where: { userId },
      orderBy: { startedAt: 'asc' },
      select: {
        id: true,
        sportType: true,
        startedAt: true,
        distanceM: true,
        durationSeconds: true,
        movingDurationSeconds: true,
        averageHr: true,
        maxHr: true,
        averageCadence: true,
        elevationGainM: true,
      },
    });

    const activities: MetricActivityInput[] = records.map((record) => ({
      id: record.id,
      sportType: record.sportType,
      startedAt: record.startedAt,
      distanceM: record.distanceM,
      durationSeconds: record.durationSeconds,
      movingDurationSeconds: record.movingDurationSeconds,
      averageHr: record.averageHr,
      maxHr: record.maxHr,
      averageCadence: record.averageCadence,
      elevationGainM: record.elevationGainM,
    }));

    const { eligibleActivities } =
      filterEligibleRunningActivities(activities);

    const recentActivities = eligibleActivities.filter((activity) => {
      const startedAt = new Date(activity.startedAt as Date | string);

      return startedAt >= recentStart && startedAt <= now;
    });

    const weeklyMetrics = aggregateActivitiesByPeriod(
      eligibleActivities,
      'weekly',
    );

    const currentPeriod =
      weeklyMetrics.find(
        (period) => period.periodKey === completedWeekKey,
      ) ?? null;

    const previousPeriod =
      weeklyMetrics.find(
        (period) => period.periodKey === previousWeekKey,
      ) ?? null;

    const limitations: CoachingLimitation[] = [];

    if (
      recentActivities.length <
      COACHING_MINIMUM_RECENT_ACTIVITIES
    ) {
      limitations.push({
        code: 'insufficient_activity_history',
        description:
          'Recent activity history is insufficient for reliable training analysis.',
      });
    }

    if (!currentPeriod || !previousPeriod) {
      limitations.push({
        code: 'missing_previous_period',
        description:
          'Two consecutive completed weekly periods are not available for comparison.',
      });
    }

    if (!recentActivities.some((activity) => activity.averageHr != null)) {
      limitations.push({
        code: 'missing_heart_rate_data',
        description: 'Recent activities do not contain heart rate data.',
      });
    }

    if (!recentActivities.some((activity) => activity.averageCadence != null)) {
      limitations.push({
        code: 'missing_cadence_data',
        description: 'Recent activities do not contain cadence data.',
      });
    }

    const personalRecords = calculatePersonalRecords(
      eligibleActivities.filter(
        (activity): activity is PersonalRecordActivityInput =>
          typeof activity.id === 'string' && activity.id.length > 0,
      ),
    );

    return {
      generatedAt: now.toISOString(),

      analysisWindow: {
        startDate: recentStart.toISOString(),
        endDate: now.toISOString(),
      },

      activities: recentActivities,

      currentPeriod,
      previousPeriod,

      periodComparison:
        currentPeriod && previousPeriod
          ? comparePeriods(currentPeriod, previousPeriod)
          : null,

      personalRecords,

      dataStatus:
        limitations.some(
          (limitation) =>
            limitation.code === 'insufficient_activity_history',
        )
          ? 'insufficient'
          : 'sufficient',

      limitations,
    };
  }
}