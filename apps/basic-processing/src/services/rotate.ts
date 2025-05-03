import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import { MessagePattern } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RotateService {
  private rotatePixels(
    inputBuffer: Buffer,
    width: number,
    height: number,
    angle: number
  ): Buffer {
    const channels = 3;
    const outputBuffer = Buffer.alloc(width * height * channels);

    const radian = angle * (Math.PI / 180);
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    const centerX = width / 2;
    const centerY = height / 2;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;

        const rotatedX = Math.round(dx * cos - dy * sin + centerX);
        const rotatedY = Math.round(dx * sin + dy * cos + centerY);

        if (
          rotatedX >= 0 && rotatedX < width &&
          rotatedY >= 0 && rotatedY < height
        ) {
          const sourceIndex = (y * width + x) * channels;
          const targetIndex = (rotatedY * width + rotatedX) * channels;

          for (let c = 0; c < channels; c++) {
            outputBuffer[targetIndex + c] = inputBuffer[sourceIndex + c];
          }
        }
      }
    }

    return outputBuffer;
  }

  @MessagePattern({ cmd: 'rotate_image' })
  async rotate(data: { imagePath: string; angle: number }) {
    try {
      const { imagePath, angle } = data;

      if (!fs.existsSync(imagePath)) {
        throw new Error('File does not exist');
      }

      const outputDir = path.join(process.cwd(), 'apps/basic-processing/output_images');
      const outputFileName = `rotated_${angle}_image.png`;
      const outputFilePath = path.join(outputDir, outputFileName);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const image = sharp(imagePath);
      const metadata = await image.metadata();
      const { width, height, channels } = metadata;

      if (!width || !height || !channels) {
        throw new Error('Invalid image metadata');
      }

      const rawData = await image.raw().toBuffer();

      const rotatedBuffer = this.rotatePixels(rawData, width, height, angle);

      await sharp(rotatedBuffer, {
        raw: {
          width,
          height,
          channels,
        }
      })
        .png()
        .toFile(outputFilePath);

      return {
        success: true,
        message: 'Image rotated successfully',
        savedImagePath: outputFilePath,
      };
    } catch (error) {
      console.error('Rotation error:', error);
      return {
        success: false,
        message: 'Failed to rotate image',
        error: error.message,
      };
    }
  }
}
