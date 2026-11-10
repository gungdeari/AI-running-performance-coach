export const COACHING_TIMEZONE = 'Asia/Makassar';

export const COACHING_MINIMUM_RECENT_ACTIVITIES = 3;

export const COACHING_WORKOUT_TYPES = [
    'easy',
    'long_run',
    'tempo',
    'interval',
    'strength_training',
] as const;

export const COACHING_DATA_STATUSES = [
    'sufficient',
    'insufficient',
] as const;

export const COACHING_OBSERVATION_SEVERITIES = [
    'info',
    'warning',
] as const;

export const COACHING_OBSERVATION_CODES = [
    'volume_trend',
    'consistency',
    'pace_trend',
    'long_run',
    'personal_record',
] as const;

export const COACHING_LIMITATION_CODES = [
    'insufficient_activity_history',
    'missing_activity_dates',
    'missing_heart_rate_data',
    'missing_cadence_data',
    'missing_previous_period',
] as const;

export const WORKOUT_INTENSITY_LEVELS = [
    'low',
    'moderate',
    'high',
] as const;

export const WORKOUT_SEGMENT_TYPES = [
    'warmup',
    'main',
    'recovery',
    'cooldown',
] as const;

export const RECOMMENDATION_VALIDATION_SEVERITIES = [
    'warning',
    'error',
] as const;