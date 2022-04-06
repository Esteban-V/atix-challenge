import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { createWriteStream, existsSync, mkdirSync, readFile, WriteStream } from 'fs';

import { Line } from './classes/Line';

@Injectable()
export class LineChainService {
  private maxNonce = 500000; //Limiting nonce so that we don't calculate for so long
  private difficulty = 2; //Number of zeros in the beginning of the hash

  private fileDir = './output';

  private fileWriteStream: WriteStream;
  private lastLine: Line;

  constructor() {
    console.log('LineChainService initializing...');

    if (!existsSync(this.fileDir)) {
      mkdirSync(this.fileDir);
      console.log('Output directory created!');
    } else if (existsSync(`${this.fileDir}/linechain.csv`)) {
      readFile(`${this.fileDir}/linechain.csv`, 'utf-8', (err, data) => {
        if (err) {
          console.log(`Error while reading file: ${err}`);
          throw err;
        }

        const lines = data.trim().split('\n');
        const lineChain = lines.map(
          (line) =>
            new Line({
              prevHash: line.split(',')[0],
              message: line.split(',')[1],
              nonce: line.split(',')[2],
            }),
        );

        console.log(`Total lines in linechain: ${lineChain.length}`);

        if (this.isLineChainValid(lineChain)) {
          const lastLine = lines.slice(-1)[0];

          if (!!lastLine) {
            const [prevHash, message, nonce] = lastLine.split(',');
            console.log(
              `Loading last line from existing linechain: ${prevHash},${message},${nonce}`,
            );

            this.setLastLine({
              prevHash,
              message,
              nonce,
            });
          }
        } else {
          throw new Error('Linechain is not valid!');
        }
      });
    }

    if (!this.fileWriteStream) {
      this.fileWriteStream = createWriteStream(
        `${this.fileDir}/linechain.csv`,
        { flags: 'a' },
      ).on('error', (err) => {
        console.log(`Error while writing to file: ${err}`);
      });
    }
    console.log('LineChainService initialized!');
  }

  public setLastLine({ prevHash, message, nonce }) {
    this.lastLine = new Line({ prevHash, message, nonce });
    console.log(`Last line changed to ${prevHash},${message},${nonce}`);
  }

  writeMessage(message: string): boolean {
    if (!this.fileWriteStream) return false; //Write stream not initialized

    const prevHash: string = this.lastLine
      ? this.lastLine.hash
      : new Array(64).fill('0').join('');

    const nonce: number = this.calculateNonce(prevHash, message);
    console.log(`Got nonce ${nonce} for ${prevHash},${message}`);

    if (nonce == undefined) {
      throw new Error('Could not calculate a valid nonce!');
    }

    this.setLastLine({ prevHash, message, nonce });

    console.log(`Writing new line to file: ${prevHash},${message},${nonce}`);

    this.fileWriteStream.write(`${prevHash},${message},${nonce}\n`);

    return true;
  }

  isLineChainValid(lineChain: Line[]): boolean {
    if (lineChain.length === 0) return true;

    let result = true;
    let index = 0;

    for (const line of lineChain.slice(1)) {
      index++;
      const prevLine = lineChain[index - 1];

      console.log(line.prevHash, prevLine.hash, {
        valid: line.prevHash == prevLine.hash,
      });

      if (line.prevHash != prevLine.hash) {
        result = false;
        break;
      }
    }

    return result;
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
