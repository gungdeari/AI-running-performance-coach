import { PrismaService } from '../prisma/prisma.service';
import { ActivityPersistenceService } from './activity-persistence.service';

describe('ActivityPersistenceService Integration', () => {
    let prisma: PrismaService;
    let persistenceService: ActivityPersistenceService;

    let userId: string;
    let externalConnectionId: string;

    const createValidPayload = (
        activityId: number,
        overrides: Record<string, unknown> = {},
    ) => ({
        activityId,
        activityType: {
        typeKey: 'running',
        },
        beginTimestamp: 1793401200000,
        activityName: 'Integration Test Run',
        distance: 5000,
        duration: 1800,
        averageHR: 150,
        ...overrides,
    });

    beforeAll(async () => {
        prisma = new PrismaService();
        await prisma.$connect();

        persistenceService = new ActivityPersistenceService(prisma);

        const user = await prisma.user.create({
        data: {
            name: 'Integration Test User',
        },
        });

        userId = user.id;

        const connection = await prisma.externalConnection.create({
        data: {
            userId,
            provider: 'GARMIN',
        },
        });

        externalConnectionId = connection.id;
    });

    afterAll(async () => {
        if (userId) {
        // User deletion cascades to connection and activities.
        await prisma.user.deleteMany({
            where: { id: userId },
        });
        }

        await prisma.$disconnect();
    });

    it('should persist valid activities and skip invalid payloads', async () => {
        const result = await persistenceService.persistActivities(
        [
            createValidPayload(900001),
            {
            activityId: 'invalid-payload',
            },
        ],
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

        const savedActivity = await prisma.activity.findUnique({
        where: {
            externalConnectionId_externalActivityId: {
            externalConnectionId,
            externalActivityId: '900001',
            },
        },
        });

        expect(savedActivity).not.toBeNull();
        expect(savedActivity?.userId).toBe(userId);
        expect(savedActivity?.sportType).toBe('running');
        expect(savedActivity?.distanceM).toBe(5000);
        expect(savedActivity?.averageHr).toBe(150);
    });

    it('should skip an activity that already exists', async () => {
        const result = await persistenceService.persistActivities(
        [createValidPayload(900001)],
        userId,
        externalConnectionId,
        );

        expect(result).toEqual({
        received: 1,
        valid: 1,
        invalid: 0,
        created: 0,
        duplicates: 1,
        });

        const count = await prisma.activity.count({
        where: {
            externalConnectionId,
            externalActivityId: '900001',
        },
        });

        expect(count).toBe(1);
    });

    it('should reject a mismatched user and connection ownership', async () => {
        const anotherUser = await prisma.user.create({
        data: {
            name: 'Another Integration Test User',
        },
        });

        try {
        await expect(
            persistenceService.persistActivities(
            [createValidPayload(900002)],
            anotherUser.id,
            externalConnectionId,
            ),
        ).rejects.toThrow();
        } finally {
        await prisma.user.delete({
            where: { id: anotherUser.id },
        });
        }
    });
});