import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GarminModule } from './garmin/garmin.module';

@Module({
  imports: [PrismaModule, GarminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
