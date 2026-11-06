export const ELIGIBLE_RUNNING_SPORT_TYPES = [
    'running',
    'treadmill_running',
  ] as const;

export const METERS_PER_KILOMETER = 1000;

export const SECONDS_PER_MINUTE = 60;

export const SECONDS_PER_HOUR = 3600;

export const PERSONAL_RECORD_TOLERANCE = 0.01;

export const PERSONAL_RECORD_TARGETS = [
  {
    key: '1k',
    label: '1K',
    distanceM: 1000,
  },
  {
    key: '1mile',
    label: '1 Mile',
    distanceM: 1609.344,
  },
  {
    key: '5k',
    label: '5K',
    distanceM: 5000,
  },
  {
    key: '10k',
    label: '10K',
    distanceM: 10000,
  },
  {
    key: 'half_marathon',
    label: 'Half Marathon',
    distanceM: 21097.5,
  },
  {
    key: 'marathon',
    label: 'Marathon',
    distanceM: 42195,
  },
] as const;