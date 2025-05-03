/* eslint-disable prettier/prettier */
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';
import { BasicProcessingService } from './basic-processing.service';

@Controller()
export class BasicProcessingController {
  constructor(private readonly basicProcessingService: BasicProcessingService) { }

  @MessagePattern({ cmd: 'resize_image' })
  async handleResize(data: { imagePath: string; width: number; height: number }) {
    console.log('Received image for resizing');
    return await this.basicProcessingService.resizeImage(data);
  }

  @MessagePattern({ cmd: 'convert_greyscale' })
  async handleGreyscale(data: { imagePath: string }) {
    console.log('Received image for greyscale conversion');
    return await this.basicProcessingService.convertToGreyscale(data.imagePath);
  }

  @MessagePattern({ cmd: 'create_negative' })
  async handleNegative(imagePath: string) {
    console.log('Received image for negative creation');
    return await this.basicProcessingService.createNegative(imagePath);
  }

  @MessagePattern({ cmd: 'adjust_contrast' })
  async handleContrast(data: { imagePath: string; contrast: number }) {
    console.log('Received image for contrast adjustment');
    return await this.basicProcessingService.adjustContrast(data);
  }

  @MessagePattern({ cmd: 'rotate_image' })
  async handleRotate(data: { imagePath: string; angle: number }) {
    console.log('Received image for rotation');
    return await this.basicProcessingService.rotateImage(data);
  }

  @MessagePattern({ cmd: 'sharpen_image' })
  async handleSharpen(imagePath: string) {
    console.log('Received image for sharpening');
    return await this.basicProcessingService.sharpenImage(imagePath);
  }

  @MessagePattern({ cmd: 'emboss_image' })
  async handleEmboss(imagePath: string) {
    console.log('Received image for embossing');
    return await this.basicProcessingService.embossImage(imagePath);
  }
}
