import {
    PeriodComparison,
    PeriodComparisonMetric,
    PeriodMetrics,
  } from './metrics.types';

  function getPreviousPeriodKey(
    currentPeriodKey: string,
    periodType: PeriodMetrics['periodType'],
  ): string {
    if (periodType === 'weekly') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(currentPeriodKey)) {
            throw new RangeError('Invalid weekly period key');
        }

        const currentDate = new Date(`${currentPeriodKey}T00:00:00.000Z`);

        if (
            Number.isNaN(currentDate.getTime()) ||
            currentDate.toISOString().slice(0, 10) !== currentPeriodKey ||
            currentDate.getUTCDay() !== 1
        ) {
            throw new RangeError('Invalid weekly period key');
        }

        currentDate.setUTCDate(currentDate.getUTCDate() - 7);

        return currentDate.toISOString().slice(0, 10);
    }

    if (periodType === 'monthly') {
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(currentPeriodKey)) {
            throw new RangeError('Invalid monthly period key');
        }

        const [year, month] = currentPeriodKey.split('-').map(Number);

        const previousDate = new Date(
            Date.UTC(year, month - 2, 1),
        );

        return [
            previousDate.getUTCFullYear(),
            String(previousDate.getUTCMonth() + 1).padStart(2, '0'),
        ].join('-');
    }

    throw new RangeError('Unsupported period type');
  }

  function calculateMetricComparison(
    currentValue: number | null,
    previousValue: number | null,
  ): PeriodComparisonMetric {
    if (currentValue === null || previousValue === null) {
        return {
            currentValue,
            previousValue,
            difference: null,
            percentageChange: null,
        };
    }

    if (
        !Number.isFinite(currentValue) ||
        !Number.isFinite(previousValue)
    ) {
         throw new RangeError('Comparison values must be finite numbers');
    }

    const difference = currentValue - previousValue;

    if (!Number.isFinite(difference)) {
        throw new RangeError('Metric difference is not finite');
    }

    const percentageChange =
        previousValue === 0
            ? null
            : (difference / previousValue) * 100;

    if (
        percentageChange !== null &&
        !Number.isFinite(percentageChange)
    ) {
        throw new RangeError('Percentage change is not finite');
    }

    return {
        currentValue,
        previousValue,
        difference,
        percentageChange,
    };
  }

  export function comparePeriods(
        current: PeriodMetrics,
        previous: PeriodMetrics,
  ): PeriodComparison {
    if (current.periodType !== previous.periodType) {
        throw new RangeError(
            'Cannot compare periods with different period types',
        );
    }

    const expectedPreviousPeriodKey = getPreviousPeriodKey(
        current.periodKey,
        current.periodType,
    );

    if (previous.periodKey !== expectedPreviousPeriodKey) {
        throw new RangeError(
            'Previous period must be exactly one period before current period',
        );
    }

    return {
        distanceKm: calculateMetricComparison(
            current.totalDistanceKm,
            previous.totalDistanceKm,
        ),

        activityCount: calculateMetricComparison(
            current.activityCount,
            previous.activityCount,
        ),

        longestRunDistanceKm: calculateMetricComparison(
            current.longestRunDistanceKm,
            previous.longestRunDistanceKm,
        ),

        averagePaceSecondsPerKm: calculateMetricComparison(
            current.averagePaceSecondsPerKm,
            previous.averagePaceSecondsPerKm,
        ),

        averageMovingPaceSecondsPerKm: calculateMetricComparison(
            current.averageMovingPaceSecondsPerKm,
            previous.averageMovingPaceSecondsPerKm,
        ),
    };
  }