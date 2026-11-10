import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { CoachingContextService } from './coaching-context.service';

@Module({
  imports: [PrismaModule],
  providers: [CoachingContextService],
  exports: [CoachingContextService],
})

export class CoachingModule {}