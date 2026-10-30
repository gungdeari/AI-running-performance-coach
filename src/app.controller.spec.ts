import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

// Prevent the unit test from loading the generated Prisma Client.
jest.mock('./prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('AppController', () => {
  let appController: AppController;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should return Hello World', () => {
    expect(appController.getHello()).toBe('Hello World!');
  });

  it('should return database connected status', async () => {
    await expect(appController.checkDatabase()).resolves.toEqual({
      status: 'ok',
      database: 'connected',
    });

    expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
  });
});