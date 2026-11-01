
import { GarminApiClient } from './garmin-api.client';
import { GarminAuthService } from './garmin-auth.service';

describe('GarminApiClient', () => {
    let client: GarminApiClient;

    const mockAuthService = {
        obtainAccessToken: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockAuthService.obtainAccessToken.mockResolvedValue(
        'mock-access-token',
        );

        client = new GarminApiClient(
        mockAuthService as unknown as GarminAuthService,
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should fetch activities successfully', async () => {
        const activities = [
        { activityId: 123, activityName: 'Test Run' },
        ];

        const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(activities), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }),
        );

        const result = await client.fetchActivities();

        expect(result).toEqual(activities);
        expect(mockAuthService.obtainAccessToken).toHaveBeenCalledTimes(1);

        const [url, options] = fetchSpy.mock.calls[0];

        expect(url).toContain(
        '/activitylist-service/activities/search/activities',
        );
        expect(url).toContain('start=0');
        expect(url).toContain('limit=10');
        expect(options?.method).toBe('GET');
        expect(options?.headers).toEqual({
        Authorization: 'Bearer mock-access-token',
        Accept: 'application/json',
        });
    });

    it('should use custom pagination parameters', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
        new Response('[]', { status: 200 }),
        );

        await client.fetchActivities(20, 25);

        const [url] = fetchSpy.mock.calls[0];

        expect(url).toContain('start=20');
        expect(url).toContain('limit=25');
    });

    it('should reject invalid start parameter', async () => {
        await expect(client.fetchActivities(-1, 10)).rejects.toThrow(
        'start harus berupa integer',
        );

        expect(mockAuthService.obtainAccessToken).not.toHaveBeenCalled();
    });

    it('should reject invalid limit parameter', async () => {
        await expect(client.fetchActivities(0, 0)).rejects.toThrow(
        'limit harus berupa integer',
        );

        expect(mockAuthService.obtainAccessToken).not.toHaveBeenCalled();
    });

    it('should reject when network request fails', async () => {
        jest.spyOn(global, 'fetch').mockRejectedValue(
        new Error('Network error'),
        );

        await expect(client.fetchActivities()).rejects.toThrow(
        'masalah jaringan atau timeout',
        );
    });

    it('should reject when Garmin returns HTTP error', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue(
        new Response('', { status: 401 }),
        );

        await expect(client.fetchActivities()).rejects.toThrow(
        'HTTP status: 401',
        );
    });

    it('should reject when response is not valid JSON', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue(
        new Response('not-json', { status: 200 }),
        );

        await expect(client.fetchActivities()).rejects.toThrow(
        'tidak dapat dibaca sebagai JSON',
        );
    });

  
    it('should propagate authentication errors', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch');
    
        mockAuthService.obtainAccessToken.mockRejectedValue(
        new Error('Authentication failed'),
        );
    
        await expect(client.fetchActivities()).rejects.toThrow(
        'Authentication failed',
        );
    
        expect(fetchSpy).not.toHaveBeenCalled();
    });
  
});
