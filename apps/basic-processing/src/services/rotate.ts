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
    angle: number,
    channels: number
  ): { buffer: Buffer; newWidth: number; newHeight: number } {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    const newWidth = Math.ceil(Math.abs(width * cos) + Math.abs(height * sin));
    const newHeight = Math.ceil(Math.abs(width * sin) + Math.abs(height * cos));
    const outputBuffer = Buffer.alloc(newWidth * newHeight * channels, 0);

    const centerX = width / 2;
    const centerY = height / 2;
    const newCenterX = newWidth / 2;
    const newCenterY = newHeight / 2;

    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        // Reverse map: target (x, y) → source (origX, origY)
        const dx = x - newCenterX;
        const dy = y - newCenterY;

        const origX = Math.round(dx * cos + dy * sin + centerX);
        const origY = Math.round(-dx * sin + dy * cos + centerY);

        if (
          origX >= 0 && origX < width &&
          origY >= 0 && origY < height
        ) {
          const srcIndex = (origY * width + origX) * channels;
          const dstIndex = (y * newWidth + x) * channels;

          for (let c = 0; c < channels; c++) {
            outputBuffer[dstIndex + c] = inputBuffer[srcIndex + c];
          }
        }
      }
    }

    return { buffer: outputBuffer, newWidth, newHeight };
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
      const { buffer: rotatedBuffer, newWidth, newHeight } = this.rotatePixels(
        rawData, width, height, angle, channels
      );

      await sharp(rotatedBuffer, {
        raw: {
          width: newWidth,
          height: newHeight,
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
