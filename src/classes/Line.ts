import { createHash } from 'crypto';

export class Line {
  prevHash: string;
  message: string;
  nonce: number;

  constructor({ prevHash, message, nonce }) {
    this.prevHash = prevHash;
    this.message = message;
    this.nonce = nonce;
  }

  get hash(): string {
    return createHash('sha256')
      .update(`${this.prevHash},${this.message},${this.nonce}`, 'utf8')
      .digest('hex')
      .toString();
  }
}
