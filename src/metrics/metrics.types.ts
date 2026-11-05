export type MetricNullableNumber = number | null;
export type MetricsPeriodType = 'weekly' | 'monthly';

export interface MetricActivityInput {
    id?: string;
    sportType: string;

    startedAt?: Date | string | null;

    distanceM: MetricNullableNumber;
    durationSeconds: MetricNullableNumber;

    movingDurationSeconds?: MetricNullableNumber;
    averageHr?: MetricNullableNumber;
    maxHr?: MetricNullableNumber;
    averageCadence?: MetricNullableNumber;
    elevationGainM?: MetricNullableNumber;
}

export type ActivityExclusionReason =
    | 'unsupported_sport_type'
    | 'invalid_distance'
    | 'invalid_duration';

export interface ActivityEligibilityResult {
    eligible: boolean;
    reasons: ActivityExclusionReason[];
}

export interface ExcludedMetricActivity {
    activity: MetricActivityInput;
    reasons: ActivityExclusionReason[];
}

export interface EligibleActivitiesResult {
    eligibleActivities: MetricActivityInput[];
    excludedActivities: ExcludedMetricActivity[];
}

export interface ActivityPaceMetrics {
    distanceKm: number;
    durationSeconds: number;
    movingDurationSeconds: number | null;
    averagePaceSecondsPerKm: number;
    movingPaceSecondsPerKm: number | null;
}

export interface RunningVolumeMetrics {
    activityCount: number;
    totalDistanceKm: number | null;
    totalDurationSeconds: number | null;
    totalMovingDurationSeconds: number | null;
    averagePaceSecondsPerKm: number | null;
    averageMovingPaceSecondsPerKm: number | null;
}

export interface RunningPhysiologyMetrics {
    averageHr: number | null;
    maxHr: number | null;
    averageCadence: number | null;
    totalElevationGainM: number | null;
}

export interface PeriodMetrics {
    periodType: MetricsPeriodType;
    periodKey: string;
    activityCount: number;
    totalDistanceKm: number | null;
    totalDurationSeconds: number | null;
    totalMovingDurationSeconds: number | null;
    averagePaceSecondsPerKm: number | null;
    averageMovingPaceSecondsPerKm: number | null;
    longestRunDistanceKm: number | null;
    averageHr: number | null;
    maxHr: number | null;
    averageCadence: number | null;
    totalElevationGainM: number | null;
}

export interface PeriodComparisonMetric {
    currentValue: number | null;
    previousValue: number | null;
    difference: number | null;
    percentageChange: number | null;
}

export interface PeriodComparison {
    distanceKm: PeriodComparisonMetric;
    activityCount: PeriodComparisonMetric;
    longestRunDistanceKm: PeriodComparisonMetric;
    averagePaceSecondsPerKm: PeriodComparisonMetric;
    averageMovingPaceSecondsPerKm: PeriodComparisonMetric;
}