import { Injectable } from '@nestjs/common';
import { createWriteStream, WriteStream } from 'fs';

@Injectable()
export class LineChainService {
  private static initialized = false;

  private static fileStream: WriteStream;

  constructor() {
    if (!LineChainService.initialized) {
      LineChainService.initialized = true;
      LineChainService.fileStream = createWriteStream('out.csv');
    }
  }

  writeMessage(message: string): boolean {
    return LineChainService.fileStream.write(`${message}\n`);
  }
}
