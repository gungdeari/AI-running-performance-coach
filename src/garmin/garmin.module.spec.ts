
import { Test } from '@nestjs/testing';
import { GarminModule } from './garmin.module';
import { GarminAuthService } from './garmin-auth.service';
import { GarminApiClient } from './garmin-api.client';

describe('GarminModule', () => {
  it('should provide GarminAuthService and GarminApiClient', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GarminModule],
    }).compile();

    expect(moduleRef.get(GarminAuthService)).toBeInstanceOf(
      GarminAuthService,
    );

    expect(moduleRef.get(GarminApiClient)).toBeInstanceOf(
      GarminApiClient,
    );

    await moduleRef.close();
  });
});
