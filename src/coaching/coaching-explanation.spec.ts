
import {
  buildCoachingExplanation,
} from './coaching-explanation';

import type {
  TrainingAnalysis,
  WorkoutPrescription,
} from './coaching.types';

function createAnalysis(): TrainingAnalysis {
  return {
    dataStatus: 'sufficient',
    observations: [
      {
        code: 'consistency',
        severity: 'info',
        summary: 'Frekuensi latihan meningkat dari 2 menjadi 3 aktivitas.',
        evidence: [
          {
            metric: 'weekly_activity_count',
            currentValue: 3,
            previousValue: 2,
            unit: 'activities',
          },
        ],
      },
      {
        code: 'pace_trend',
        severity: 'info',
        summary: 'Rata-rata pace lebih cepat dibanding periode sebelumnya.',
        evidence: [
          {
            metric: 'average_elapsed_pace',
            currentValue: 420,
            previousValue: 450,
            unit: 'seconds/km',
          },
        ],
      },
    ],
    limitations: [
      {
        code: 'missing_heart_rate_data',
        description: 'Data heart rate belum tersedia secara lengkap.',
      },
    ],
  };
}

function createPrescription(): WorkoutPrescription {
  return {
    workoutType: 'easy',
    title: 'Easy Run',
    objective: 'Menjaga konsistensi latihan.',
    intensity: 'low',
    durationMinutes: 30,
    distanceKm: null,
    segments: [
      {
        type: 'warmup',
        description: 'Jalan cepat dan jogging ringan.',
        durationMinutes: 5,
        distanceKm: null,
      },
      {
        type: 'main',
        description: 'Lari dengan intensitas nyaman.',
        durationMinutes: 20,
        distanceKm: null,
      },
      {
        type: 'cooldown',
        description: 'Jalan santai.',
        durationMinutes: 5,
        distanceKm: null,
      },
    ],
    rationaleObservationCodes: ['consistency'],
  };
}

describe('Coaching Explanation', () => {
  it('should build a summary from the workout prescription', () => {
    const result = buildCoachingExplanation(
      createAnalysis(),
      createPrescription(),
    );

    expect(result.summary).toContain('Easy Run');
    expect(result.summary).toContain('Menjaga konsistensi latihan.');
    expect(result.summary).toContain('30 menit');
    expect(result.summary).toContain('rendah');
  });

  it('should include only observations referenced by the prescription', () => {
    const result = buildCoachingExplanation(
      createAnalysis(),
      createPrescription(),
    );

    expect(result.rationale).toContain(
      'Frekuensi latihan meningkat dari 2 menjadi 3 aktivitas.',
    );

    expect(result.rationale).not.toContain(
      'Rata-rata pace lebih cepat dibanding periode sebelumnya.',
    );
  });

  it('should preserve the order of rationale observation codes', () => {
    const prescription = createPrescription();
    prescription.rationaleObservationCodes = [
      'pace_trend',
      'consistency',
    ];

    const result = buildCoachingExplanation(
      createAnalysis(),
      prescription,
    );

    expect(result.rationale[0]).toBe(
      'Rata-rata pace lebih cepat dibanding periode sebelumnya.',
    );

    expect(result.rationale[1]).toBe(
      'Frekuensi latihan meningkat dari 2 menjadi 3 aktivitas.',
    );
  });

  it('should provide a transparent fallback when no observation matches', () => {
    const prescription = createPrescription();
    prescription.rationaleObservationCodes = [];

    const result = buildCoachingExplanation(
      createAnalysis(),
      prescription,
    );

    expect(result.rationale[0]).toContain(
      'Belum ada observasi latihan',
    );
  });

  it('should explain workout segments', () => {
    const result = buildCoachingExplanation(
      createAnalysis(),
      createPrescription(),
    );

    expect(result.rationale).toContain(
      'warmup: Jalan cepat dan jogging ringan.',
    );

    expect(result.rationale).toContain(
      'main: Lari dengan intensitas nyaman.',
    );

    expect(result.rationale).toContain(
      'cooldown: Jalan santai.',
    );
  });

  it('should preserve analysis limitations', () => {
    const result = buildCoachingExplanation(
      createAnalysis(),
      createPrescription(),
    );

    expect(result.limitations).toEqual([
      'Data heart rate belum tersedia secara lengkap.',
    ]);
  });

  it('should format distance-based workout targets', () => {
    const prescription: WorkoutPrescription = {
      ...createPrescription(),
      workoutType: 'long_run',
      title: 'Long Run',
      objective: 'Menjaga baseline jarak lari panjang.',
      durationMinutes: null,
      distanceKm: 8,
      rationaleObservationCodes: ['consistency'],
    };

    const result = buildCoachingExplanation(
      createAnalysis(),
      prescription,
    );

    expect(result.summary).toContain('8.0 km');
  });
});
