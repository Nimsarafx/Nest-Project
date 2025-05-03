import { Module } from '@nestjs/common';
import { BasicProcessingController, EnhancementController, FeatureDetectionController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'BASIC_PROCESSING_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 4001 },
      },
      {
        name: 'ENHANCEMENT_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 4002 },
      },
      {
        name: 'FEATURE_DETECTION_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 4003 },
      },
    ]),
  ],
  controllers: [BasicProcessingController, EnhancementController, FeatureDetectionController],
  providers: [AppService],
})
export class AppModule { }

