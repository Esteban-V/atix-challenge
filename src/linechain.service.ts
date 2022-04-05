import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { createWriteStream, existsSync, mkdirSync, WriteStream } from 'fs';

@Injectable()
export class LineChainService {
  private maxNonce = 500000; //Limiting nonce so that we don't calculate for so long

  private static initialized = false; //Prevent initializing the writeStream more than once
  private static fileDir = './output';

  private static fileWriteStream: WriteStream;
  private static lastLine: Line;

  constructor() {
    if (!LineChainService.initialized) {
      LineChainService.initialized = true;

      if (!existsSync(LineChainService.fileDir)) {
        mkdirSync(LineChainService.fileDir);
      }

      LineChainService.fileWriteStream = createWriteStream(
        `${LineChainService.fileDir}/linechain.csv`,
      );
    }
  }

  public static setLastLine({ prevHash, message, nonce }: Line) {
    LineChainService.lastLine = { prevHash, message, nonce };
  }

  get lastLine(): Line {
    return LineChainService.lastLine;
  }

  writeMessage(message: string): boolean {
    const prevHash = this.lastLine
      ? this.hash(this.lastLine)
      : new Array(64).fill('0').join('');

    const nonce = this.calculateNonce(prevHash, message);

    LineChainService.setLastLine({ prevHash, message, nonce });

    return LineChainService.fileWriteStream.write(
      `${prevHash},${message},${nonce}\n`,
    );
  }

  calculateNonce(prevHash: string, message: string) {
    for (let nonce = 0; nonce < this.maxNonce; nonce++) {
      const hash = this.hash({ prevHash, message, nonce });

      if (hash.match('^00.*')) {
        return nonce;
      }
    }
  }

  private hash({ prevHash, message, nonce }: Line): string {
    return createHash('sha256')
      .update(`${prevHash},${message},${nonce}`, 'utf8')
      .digest('hex')
      .toString();
  }
}
