import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFile,
  WriteStream,
} from 'fs';

import { Line } from './classes/Line';

@Injectable()
export class LineChainService {
  private maxNonce = 500000; //Limiting nonce so that we don't calculate for so long
  private difficulty = 2; //Number of zeros in the beginning of the hash

  private static fileDir = './output';

  private static fileWriteStream: WriteStream;
  private static lastLine: Line;

  constructor() {
    console.log('LineChainService constructing...');
    //Prevent initializing the writeStream more than once
    if (!LineChainService.fileWriteStream) {
      if (!existsSync(LineChainService.fileDir)) {
        mkdirSync(LineChainService.fileDir);
        console.log('Output directory created!');
      } else if (existsSync(`${LineChainService.fileDir}/linechain.csv`)) {
        readFile(
          `${LineChainService.fileDir}/linechain.csv`,
          'utf-8',
          (err, data) => {
            if (err) {
              console.log(`Error while reading file: ${err}`);
              throw err;
            }

            const lines = data.trim().split('\n');
            const lastLine = lines.slice(-1)[0];

            if (!!lastLine) {
              const [prevHash, message, nonce] = lastLine.split(',');
              console.log(
                `Loading last line from existing linechain: ${prevHash},${message},${nonce}`,
              );

              LineChainService.setLastLine({
                prevHash,
                message,
                nonce,
              });
            }
          },
        );
      }

      LineChainService.fileWriteStream = createWriteStream(
        `${LineChainService.fileDir}/linechain.csv`,
        { flags: 'a' },
      );

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
    if (!LineChainService.fileWriteStream) return false; //Write stream not initialized

    const prevHash: string = this.lastLine
      ? this.lastLine.hash
      : new Array(64).fill('0').join('');

    const nonce: number = this.calculateNonce(prevHash, message);
    console.log(`Got nonce ${nonce} for ${prevHash},${message}`);

    if (nonce == undefined) return false; //Unable to find a valid nonce

    LineChainService.setLastLine({ prevHash, message, nonce });

    console.log(`Writing new line to file: ${prevHash},${message},${nonce}`);
    return LineChainService.fileWriteStream.write(
      `${prevHash},${message},${nonce}\n`,
    );
  }

  isValidHash(hash: string): boolean {
    return !!hash.match(`^${new Array(this.difficulty).fill('0').join('')}.*`);
  }

  calculateNonce(prevHash: string, message: string) {
    for (let nonce = 0; nonce < this.maxNonce; nonce++) {
      const hash = createHash('sha256')
        .update(`${prevHash},${message},${nonce}`, 'utf8')
        .digest('hex')
        .toString();

      if (this.isValidHash(hash)) {
        return nonce;
      }
    }
  }
}
