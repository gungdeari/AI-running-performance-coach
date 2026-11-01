
import { GarminSyncService } from './garmin-sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { GarminPaginationService } from './garmin-pagination.service';
import { ActivityPersistenceService } from './activity-persistence.service';

describe('GarminSyncService', () => {
    let service: GarminSyncService;

    let prisma: {
        externalConnection: {
        findFirst: jest.Mock;
        update: jest.Mock;
        };
        syncRun: {
        create: jest.Mock;
        update: jest.Mock;
        };
        $transaction: jest.Mock;
    };

    let paginationService: {
        fetchAllActivities: jest.Mock;
    };

    let persistenceService: {
        persistActivities: jest.Mock;
    };

    const userId = 'user-test-id';
    const connectionId = 'connection-test-id';
    const syncRunId = 'sync-run-test-id';

    beforeEach(() => {
        prisma = {
        externalConnection: {
            findFirst: jest.fn().mockResolvedValue({
            id: connectionId,
            userId,
            provider: 'GARMIN',
            status: 'ACTIVE',
            }),
            update: jest.fn().mockResolvedValue({}),
        },
        syncRun: {
            create: jest.fn().mockResolvedValue({ id: syncRunId }),
            update: jest.fn().mockResolvedValue({}),
        },
        $transaction: jest.fn(async (operations) =>
            Promise.all(operations),
        ),
        };

        paginationService = {
        fetchAllActivities: jest.fn().mockResolvedValue([
            { activityId: 'activity-1' },
            { activityId: 'activity-2' },
        ]),
        };

        persistenceService = {
        persistActivities: jest.fn().mockResolvedValue({
            received: 2,
            valid: 2,
            invalid: 0,
            created: 2,
            duplicates: 0,
        }),
        };

        service = new GarminSyncService(
        prisma as unknown as PrismaService,
        paginationService as unknown as GarminPaginationService,
        persistenceService as unknown as ActivityPersistenceService,
        );
    });

    it('should complete sync successfully', async () => {
        const result = await service.syncActivities(userId, connectionId);

        expect(prisma.externalConnection.findFirst).toHaveBeenCalledWith({
        where: {
            id: connectionId,
            userId,
            provider: 'GARMIN',
            status: 'ACTIVE',
        },
        });

        expect(prisma.syncRun.create).toHaveBeenCalledWith({
        data: {
            userId,
            externalConnectionId: connectionId,
            status: 'RUNNING',
        },
        });

        expect(paginationService.fetchAllActivities).toHaveBeenCalled();
        expect(persistenceService.persistActivities).toHaveBeenCalled();

        expect(result).toEqual({
        syncRunId,
        status: 'SUCCEEDED',
        activitiesFetched: 2,
        activitiesCreated: 2,
        activitiesUpdated: 0,
        activitiesInvalid: 0,
        activitiesDuplicates: 0,
        });

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should mark sync as PARTIAL when invalid activities exist', async () => {
        persistenceService.persistActivities.mockResolvedValue({
        received: 3,
        valid: 2,
        invalid: 1,
        created: 1,
        duplicates: 1,
        });

        const result = await service.syncActivities(userId, connectionId);

        expect(result.status).toBe('PARTIAL');
        expect(result.activitiesInvalid).toBe(1);
        expect(result.activitiesDuplicates).toBe(1);
    });

    it('should reject when active Garmin connection is not found', async () => {
        prisma.externalConnection.findFirst.mockResolvedValue(null);

        await expect(
        service.syncActivities(userId, connectionId),
        ).rejects.toThrow('Active Garmin connection not found.');

        expect(prisma.syncRun.create).not.toHaveBeenCalled();
        expect(paginationService.fetchAllActivities).not.toHaveBeenCalled();
    });

    it('should mark sync as FAILED when Garmin fetching fails', async () => {
        paginationService.fetchAllActivities.mockRejectedValue(
        new Error('Garmin API unavailable'),
        );

        await expect(
        service.syncActivities(userId, connectionId),
        ).rejects.toThrow('Garmin API unavailable');

        expect(prisma.syncRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { id: syncRunId },
            data: expect.objectContaining({
            status: 'FAILED',
            errorCode: 'GARMIN_SYNC_FAILED',
            }),
        }),
        );
    });

    it('should mark sync as FAILED when persistence fails', async () => {
        persistenceService.persistActivities.mockRejectedValue(
        new Error('Database write failed'),
        );

        await expect(
        service.syncActivities(userId, connectionId),
        ).rejects.toThrow('Database write failed');

        expect(prisma.syncRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { id: syncRunId },
            data: expect.objectContaining({
            status: 'FAILED',
            }),
        }),
        );
    });
});
