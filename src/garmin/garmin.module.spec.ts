jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class MockPrismaService {},
}));

import { Test } from '@nestjs/testing';

import { GarminModule } from './garmin.module';
import { GarminAuthService } from './garmin-auth.service';
import { GarminApiClient } from './garmin-api.client';
import { GarminPaginationService } from './garmin-pagination.service';
import { ActivityPersistenceService } from './activity-persistence.service';
import { PrismaService } from '../prisma/prisma.service';
import { GarminSyncService } from './garmin-sync.service';

describe('GarminModule', () => {
  it('should provide Garmin services', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GarminModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        activity: {
          createMany: jest.fn(),
        },
      })
      .compile();

    expect(moduleRef.get(GarminAuthService)).toBeInstanceOf(
      GarminAuthService,
    );

    expect(moduleRef.get(GarminApiClient)).toBeInstanceOf(
      GarminApiClient,
    );

    expect(moduleRef.get(GarminPaginationService),).toBeInstanceOf(
      GarminPaginationService
    );

    expect(moduleRef.get(GarminSyncService),).toBeInstanceOf(
      GarminSyncService
    );

    expect(moduleRef.get(ActivityPersistenceService),).toBeInstanceOf(
      ActivityPersistenceService
    );

    await moduleRef.close();
  });
});
