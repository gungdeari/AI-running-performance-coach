import { ELIGIBLE_RUNNING_SPORT_TYPES } from './metrics.constants';

import {
    ActivityEligibilityResult,
    EligibleActivitiesResult,
    MetricActivityInput,
} from './metrics.types';

import { isValidPositiveNumber } from './metrics.validation';

export function validateActivityEligibility(
    activity: MetricActivityInput,
): ActivityEligibilityResult {
    const reasons: ActivityEligibilityResult['reasons'] = [];

    if (
        !ELIGIBLE_RUNNING_SPORT_TYPES.includes(
        activity.sportType as (typeof ELIGIBLE_RUNNING_SPORT_TYPES)[number],
        )
    ) {
        reasons.push('unsupported_sport_type');
    }

    if (!isValidPositiveNumber(activity.distanceM)) {
        reasons.push('invalid_distance');
    }

    if (!isValidPositiveNumber(activity.durationSeconds)) {
        reasons.push('invalid_duration');
    }

    return {
        eligible: reasons.length === 0,
        reasons,
    };
}

export function filterEligibleRunningActivities(
  activities: MetricActivityInput[],
): EligibleActivitiesResult {
    const eligibleActivities: MetricActivityInput[] = [];
    const excludedActivities: EligibleActivitiesResult['excludedActivities'] =
        [];

    for (const activity of activities) {
        const result = validateActivityEligibility(activity);

        if (result.eligible) {
        eligibleActivities.push(activity);
        continue;
        }

        excludedActivities.push({
        activity,
        reasons: result.reasons,
        });
    }

    return {
        eligibleActivities,
        excludedActivities,
    };
}