import {
  COACHING_WORKOUT_TYPES,
  COACHING_DATA_STATUSES,
  COACHING_OBSERVATION_SEVERITIES,
  COACHING_OBSERVATION_CODES,
  COACHING_LIMITATION_CODES,
  WORKOUT_INTENSITY_LEVELS,
  WORKOUT_SEGMENT_TYPES,
  RECOMMENDATION_VALIDATION_SEVERITIES,
} from './coaching.constants';
  
describe('Coaching contracts', () => {
  it('should define the supported workout types', () => {
    expect(COACHING_WORKOUT_TYPES).toEqual([
      'easy',
      'long_run',
      'tempo',
      'interval',
      'strength_training',
    ]);
  });

  it('should define coaching data statuses', () => {
    expect(COACHING_DATA_STATUSES).toEqual([
      'sufficient',
      'insufficient',
    ]);
  });

  it('should define observation codes and severities', () => {
    expect(COACHING_OBSERVATION_CODES).toHaveLength(5);
    expect(COACHING_OBSERVATION_SEVERITIES).toEqual([
      'info',
      'warning',
    ]);
  });

  it('should define coaching limitation codes', () => {
    expect(COACHING_LIMITATION_CODES).toHaveLength(5);
  });

  it('should define workout intensity levels', () => {
    expect(WORKOUT_INTENSITY_LEVELS).toEqual([
      'low',
      'moderate',
      'high',
    ]);
  });

  it('should define workout segment types', () => {
    expect(WORKOUT_SEGMENT_TYPES).toEqual([
      'warmup',
      'main',
      'recovery',
      'cooldown',
    ]);
  });

  it('should define recommendation validation severities', () => {
    expect(RECOMMENDATION_VALIDATION_SEVERITIES).toEqual([
      'warning',
      'error',
    ]);
  });
});