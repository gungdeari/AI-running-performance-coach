import { CoachingContextService } from './coaching-context.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CoachingContextService', () => {
  let service: CoachingContextService;
  let prisma: {
    activity: {
      findMany: jest.Mock;
    };
  };

  const now = new Date('2026-11-07T10:00:00+08:00');

  beforeEach(() => {
    prisma = {
      activity: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'activity-1',
            sportType: 'running',
            startedAt: new Date('2026-10-20T08:00:00+08:00'),
            distanceM: 5000,
            durationSeconds: 2100,
            movingDurationSeconds: 2000,
            averageHr: 150,
            maxHr: 170,
            averageCadence: 160,
            elevationGainM: 20,
          },
          {
            id: 'activity-2',
            sportType: 'running',
            startedAt: new Date('2026-10-27T08:00:00+08:00'),
            distanceM: 6000,
            durationSeconds: 2500,
            movingDurationSeconds: 2400,
            averageHr: 155,
            maxHr: 175,
            averageCadence: 162,
            elevationGainM: 25,
          },
          {
            id: 'activity-3',
            sportType: 'running',
            startedAt: new Date('2026-11-03T08:00:00+08:00'),
            distanceM: 5000,
            durationSeconds: 2200,
            movingDurationSeconds: 2100,
            averageHr: 152,
            maxHr: 172,
            averageCadence: 161,
            elevationGainM: 18,
          },
        ]),
      },
    };

    service = new CoachingContextService(
      prisma as unknown as PrismaService,
    );
  });

  it('should scope activity query to the requested user', async () => {
    await service.buildContext('user-1', now);

    expect(prisma.activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
      }),
    );
  });

  it('should build completed weekly periods and current activity context', async () => {
    const context = await service.buildContext('user-1', now);

    expect(context.currentPeriod?.periodKey).toBe('2026-10-26');
    expect(context.previousPeriod?.periodKey).toBe('2026-10-19');

    expect(context.periodComparison).not.toBeNull();

    expect(context.activities).toHaveLength(3);
    expect(context.dataStatus).toBe('sufficient');
  });

  it('should calculate personal records from eligible activities', async () => {
    const context = await service.buildContext('user-1', now);

    const fiveKRecord = context.personalRecords.find(
      (record) => record.key === '5k',
    );

    expect(fiveKRecord?.record?.activityId).toBe('activity-1');
  });

  it('should report insufficient history when recent activities are below minimum', async () => {
    prisma.activity.findMany.mockResolvedValue([]);

    const context = await service.buildContext('user-1', now);

    expect(context.dataStatus).toBe('insufficient');

    expect(context.limitations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'insufficient_activity_history',
        }),
      ]),
    );
  });

  it('should reject an empty user ID', async () => {
    await expect(
      service.buildContext(' ', now),
    ).rejects.toThrow('User ID is required');

    expect(prisma.activity.findMany).not.toHaveBeenCalled();
  });

  it('should reject an invalid reference date', async () => {
    await expect(
      service.buildContext('user-1', new Date('invalid')),
    ).rejects.toThrow('Invalid reference date');
  });
});