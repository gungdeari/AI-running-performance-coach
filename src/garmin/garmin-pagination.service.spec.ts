
import { GarminPaginationService } from './garmin-pagination.service';
import { GarminAuthService } from './garmin-auth.service';
import { GarminApiClient } from './garmin-api.client';

describe('GarminPaginationService', () => {
  let service: GarminPaginationService;

  const mockAuthService = {
    obtainAccessToken: jest.fn(),
  };

  const mockApiClient = {
    fetchActivitiesWithToken: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthService.obtainAccessToken.mockResolvedValue(
      'mock-access-token',
    );

    service = new GarminPaginationService(
      mockAuthService as unknown as GarminAuthService,
      mockApiClient as unknown as GarminApiClient,
    );
  });

  it('should fetch multiple pages until the last partial page', async () => {
    mockApiClient.fetchActivitiesWithToken
      .mockResolvedValueOnce(Array(10).fill({ activityId: 1 }))
      .mockResolvedValueOnce(Array(10).fill({ activityId: 2 }))
      .mockResolvedValueOnce([
        { activityId: 21 },
        { activityId: 22 },
      ]);

    const result = await service.fetchAllActivities(10, 100);

    expect(result).toHaveLength(22);
    expect(mockAuthService.obtainAccessToken).toHaveBeenCalledTimes(1);

    expect(mockApiClient.fetchActivitiesWithToken).toHaveBeenNthCalledWith(
      1,
      0,
      10,
      'mock-access-token',
    );

    expect(mockApiClient.fetchActivitiesWithToken).toHaveBeenNthCalledWith(
      2,
      10,
      10,
      'mock-access-token',
    );

    expect(mockApiClient.fetchActivitiesWithToken).toHaveBeenNthCalledWith(
      3,
      20,
      10,
      'mock-access-token',
    );
  });

  it('should stop when the first page is empty', async () => {
    mockApiClient.fetchActivitiesWithToken.mockResolvedValueOnce([]);

    const result = await service.fetchAllActivities();

    expect(result).toEqual([]);
    expect(mockApiClient.fetchActivitiesWithToken).toHaveBeenCalledTimes(1);
  });

  it('should stop when the first page is partial', async () => {
    mockApiClient.fetchActivitiesWithToken.mockResolvedValueOnce([
      { activityId: 1 },
      { activityId: 2 },
    ]);

    const result = await service.fetchAllActivities(10);

    expect(result).toHaveLength(2);
    expect(mockApiClient.fetchActivitiesWithToken).toHaveBeenCalledTimes(1);
  });

  it('should reject when response is not an array', async () => {
    mockApiClient.fetchActivitiesWithToken.mockResolvedValueOnce({
      activities: [],
    });

    await expect(service.fetchAllActivities()).rejects.toThrow(
      'bukan array',
    );
  });

  it('should reject when maximum pages are reached', async () => {
    mockApiClient.fetchActivitiesWithToken.mockResolvedValue(
      Array(10).fill({ activityId: 1 }),
    );

    await expect(service.fetchAllActivities(10, 2)).rejects.toThrow(
      'Batas maksimum pagination',
    );

    expect(mockApiClient.fetchActivitiesWithToken).toHaveBeenCalledTimes(2);
  });

  it('should reject invalid page size', async () => {
    await expect(service.fetchAllActivities(0)).rejects.toThrow(
      'pageSize harus berupa integer',
    );

    expect(mockAuthService.obtainAccessToken).not.toHaveBeenCalled();
  });

  it('should reject invalid maximum pages', async () => {
    await expect(service.fetchAllActivities(10, 0)).rejects.toThrow(
      'maxPages harus berupa integer',
    );

    expect(mockAuthService.obtainAccessToken).not.toHaveBeenCalled();
  });

  it('should propagate API errors', async () => {
    mockApiClient.fetchActivitiesWithToken.mockRejectedValueOnce(
      new Error('Garmin API unavailable'),
    );

    await expect(service.fetchAllActivities()).rejects.toThrow(
      'Garmin API unavailable',
    );
  });
});
