import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { createWriteStream, existsSync, mkdirSync, WriteStream } from 'fs';
import { Line } from './interfaces/Line';

@Injectable()
export class LineChainService {
  private maxNonce = 500000; //Limiting nonce so that we don't calculate for so long

  private static initialized = false; //Prevent initializing the writeStream more than once
  private static fileDir = './output';

  private static fileWriteStream: WriteStream;
  private static lastLine;

  constructor() {
    console.log('LineChainService constructing...');
    if (!LineChainService.initialized) {
      if (!existsSync(LineChainService.fileDir)) {
        mkdirSync(LineChainService.fileDir);
        console.log('Output directory created!');
      }

      LineChainService.fileWriteStream = createWriteStream(
        `${LineChainService.fileDir}/linechain.csv`,
      );

      LineChainService.initialized = true;
      console.log('LineChainService initialized!');
    }
  }

  public static setLastLine({ prevHash, message, nonce }) {
    LineChainService.lastLine = new Line({ prevHash, message, nonce });
    console.log(`Last line changed to ${prevHash},${message},${nonce}`);
  }

  get lastLine(): Line {
    return LineChainService.lastLine;
  }

  writeMessage(message: string): boolean {
    const prevHash: string = this.lastLine
      ? this.lastLine.hash
      : new Array(64).fill('0').join('');

    const nonce: number = this.calculateNonce(prevHash, message);
    console.log(`Got nonce ${nonce} for ${prevHash},${message}`);

    if (!nonce) return false; //Unable to find a valid nonce

    LineChainService.setLastLine({ prevHash, message, nonce });

    console.log(`Writing new line to file: ${prevHash},${message},${nonce}`);
    return LineChainService.fileWriteStream.write(
      `${prevHash},${message},${nonce}\n`,
    );
  }

  calculateNonce(prevHash: string, message: string) {
    for (let nonce = 0; nonce < this.maxNonce; nonce++) {
      const hash = createHash('sha256')
        .update(`${prevHash},${message},${nonce}`, 'utf8')
        .digest('hex')
        .toString();

      if (hash.match('^00.*')) {
        return nonce;
      }
    }
  }
}
