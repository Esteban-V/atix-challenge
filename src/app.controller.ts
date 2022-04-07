import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';

import { LineChainService } from './linechain.service';

@Controller()
export class AppController {
  constructor(private readonly lineChainService: LineChainService) {}

  @Post()
  writeMessage(@Body() { message }: { message: string }) {
    if (!message)
      throw new HttpException('Message is required', HttpStatus.BAD_REQUEST);

    try {
      return this.lineChainService.writeMessage(message);
    } catch (err) {
      return err.message;
    }
  }
}
