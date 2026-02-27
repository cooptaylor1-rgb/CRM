import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { ResearchProcessorService } from './research-processor.service';

import { ResearchItem } from './entities/research-item.entity';
import { ResearchSource } from './entities/research-source.entity';
import { ResearchAttachment } from './entities/research-attachment.entity';
import { ResearchAnnotation } from './entities/research-annotation.entity';

export const RESEARCH_QUEUE = 'research-processing';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    TypeOrmModule.forFeature([
      ResearchItem,
      ResearchSource,
      ResearchAttachment,
      ResearchAnnotation,
    ]),
    BullModule.registerQueue({
      name: RESEARCH_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
  ],
  controllers: [ResearchController],
  providers: [ResearchService, ResearchProcessorService],
  exports: [ResearchService, ResearchProcessorService],
})
export class ResearchModule {}
