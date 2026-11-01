jest.mock('../prisma/prisma.service', () => ({
    PrismaService: class MockPrismaService {},
}));

import { Test, TestingModule } from '@nestjs/testing';

import { ActivityPersistenceService } from './activity-persistence.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ActivityPersistenceService', () => {
    let service: ActivityPersistenceService;

    const mockPrismaService = {
        activity: {
        createMany: jest.fn(),
        },
    };

    const userId = '11111111-1111-4111-8111-111111111111';
    const externalConnectionId =
        '22222222-2222-4222-8222-222222222222';

    const createValidPayload = (
        overrides: Record<string, unknown> = {},
    ) => ({
        activityId: 123456789,
        activityType: {
        typeKey: 'running',
        },
        beginTimestamp: 1793401200000,
        ...overrides,
    });

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule =
        await Test.createTestingModule({
            providers: [
            ActivityPersistenceService,
            {
                provide: PrismaService,
                useValue: mockPrismaService,
            },
            ],
        }).compile();

        service = module.get<ActivityPersistenceService>(
        ActivityPersistenceService,
        );

        mockPrismaService.activity.createMany.mockResolvedValue({
        count: 1,
        });
    });

    it('should create valid activities', async () => {
        const payloads = [
        createValidPayload(),
        ];

        const result = await service.persistActivities(
        payloads,
        userId,
        externalConnectionId,
        );

        expect(result).toEqual({
        received: 1,
        valid: 1,
        invalid: 0,
        created: 1,
        duplicates: 0,
        });

        expect(
        mockPrismaService.activity.createMany,
        ).toHaveBeenCalledTimes(1);
    });

    it('should map activity fields correctly to Prisma', async () => {
        const payloads = [
        createValidPayload({
            activityName: 'Morning Run',
            distance: 5000,
            duration: 1800,
            averageHR: 150,
            maxHR: 175,
            calories: 300,
            steps: 5000,
        }),
        ];

        await service.persistActivities(
        payloads,
        userId,
        externalConnectionId,
        );

        const createManyCall =
        mockPrismaService.activity.createMany.mock.calls[0][0];

        expect(createManyCall.data[0]).toMatchObject({
        userId,
        externalConnectionId,
        externalActivityId: '123456789',
        name: 'Morning Run',
        sportType: 'running',
        distanceM: 5000,
        durationSeconds: 1800,
        averageHr: 150,
        maxHr: 175,
        calories: 300,
        steps: 5000,
        });

        expect(createManyCall.data[0]).toMatchObject({
        elevationGainM: null,
        elevationLossM: null,
        averagePowerW: null,
        normalizedPowerW: null,
        });
    });

    it('should skip invalid payloads and persist valid activities', async () => {
        const payloads = [
        createValidPayload(),
        {
            activityId: null,
            activityType: {
            typeKey: 'running',
            },
            beginTimestamp: 1793401200000,
        },
        ];

        const result = await service.persistActivities(
        payloads,
        userId,
        externalConnectionId,
        );

        expect(result).toEqual({
        received: 2,
        valid: 1,
        invalid: 1,
        created: 1,
        duplicates: 0,
        });

        expect(
        mockPrismaService.activity.createMany,
        ).toHaveBeenCalledTimes(1);

        expect(
        mockPrismaService.activity.createMany.mock.calls[0][0].data,
        ).toHaveLength(1);
    });

    it('should return zero counts when all payloads are invalid', async () => {
        const payloads = [
        { activityId: null },
        { activityType: 'running' },
        ];

        const result = await service.persistActivities(
        payloads,
        userId,
        externalConnectionId,
        );

        expect(result).toEqual({
        received: 2,
        valid: 0,
        invalid: 2,
        created: 0,
        duplicates: 0,
        });

        expect(
        mockPrismaService.activity.createMany,
        ).not.toHaveBeenCalled();
    });

    it('should return zero counts for an empty payload array', async () => {
        const result = await service.persistActivities(
        [],
        userId,
        externalConnectionId,
        );

        expect(result).toEqual({
        received: 0,
        valid: 0,
        invalid: 0,
        created: 0,
        duplicates: 0,
        });

        expect(
        mockPrismaService.activity.createMany,
        ).not.toHaveBeenCalled();
    });

    it('should count duplicate activities using Prisma createMany count', async () => {
        mockPrismaService.activity.createMany.mockResolvedValue({
        count: 1,
        });

        const payloads = [
        createValidPayload({
            activityId: 1001,
        }),
        createValidPayload({
            activityId: 1002,
        }),
        ];

        const result = await service.persistActivities(
        payloads,
        userId,
        externalConnectionId,
        );

        expect(result).toEqual({
        received: 2,
        valid: 2,
        invalid: 0,
        created: 1,
        duplicates: 1,
        });

        expect(
        mockPrismaService.activity.createMany,
        ).toHaveBeenCalledWith(
        expect.objectContaining({
            skipDuplicates: true,
        }),
        );
    });

    it('should propagate database errors', async () => {
        mockPrismaService.activity.createMany.mockRejectedValue(
        new Error('Database connection failed'),
        );

        await expect(
        service.persistActivities(
            [createValidPayload()],
            userId,
            externalConnectionId,
        ),
        ).rejects.toThrow('Database connection failed');
    });
});
