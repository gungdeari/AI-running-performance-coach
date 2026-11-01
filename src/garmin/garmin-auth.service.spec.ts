
import { GarminAuthService } from './garmin-auth.service';

describe('GarminAuthService', () => {
  let service: GarminAuthService;
  const originalApiKey = process.env.GARMIN_PERSONAL_API_KEY;

  const createToken = (exp: number) => {
    const header = Buffer.from(
      JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
    ).toString('base64url');

    const payload = Buffer.from(JSON.stringify({ exp })).toString(
      'base64url',
    );

    return `${header}.${payload}.mock-signature`;
  };

  beforeEach(() => {
    service = new GarminAuthService();
    process.env.GARMIN_PERSONAL_API_KEY = 'test-api-key';

    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.GARMIN_PERSONAL_API_KEY;
    } else {
      process.env.GARMIN_PERSONAL_API_KEY = originalApiKey;
    }
  });

  it('should obtain a valid access token', async () => {
    const token = createToken(Math.floor(Date.now() / 1000) + 3600);

    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(token, { status: 200 }),
    );

    await expect(service.obtainAccessToken()).resolves.toBe(token);
  });

  it('should reject when API key is missing', async () => {
    delete process.env.GARMIN_PERSONAL_API_KEY;

    await expect(service.obtainAccessToken()).rejects.toThrow(
      'GARMIN_PERSONAL_API_KEY tidak ditemukan',
    );
  });

  it('should reject when Garmin returns HTTP error', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('', { status: 401 }),
    );

    await expect(service.obtainAccessToken()).rejects.toThrow(
      'HTTP status: 401',
    );
  });

  it('should reject when network request fails', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    await expect(service.obtainAccessToken()).rejects.toThrow(
      'masalah jaringan atau timeout',
    );
  });

  it('should reject an invalid JWT format', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('invalid-token', { status: 200 }),
    );

    await expect(service.obtainAccessToken()).rejects.toThrow(
      'format JWT',
    );
  });

  it('should reject a JWT without valid expiration', async () => {
    const header = Buffer.from('{}').toString('base64url');
    const payload = Buffer.from(JSON.stringify({ exp: 'invalid' })).toString(
      'base64url',
    );

    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(`${header}.${payload}.signature`, { status: 200 }),
    );

    await expect(service.obtainAccessToken()).rejects.toThrow(
      'klaim exp yang valid',
    );
  });

  it('should reject an expired JWT', async () => {
    const token = createToken(Math.floor(Date.now() / 1000) - 3600);

    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(token, { status: 200 }),
    );

    await expect(service.obtainAccessToken()).rejects.toThrow(
      'sudah kedaluwarsa',
    );
  });
});
