import { Body, Controller, Post } from '@nestjs/common';

import { LineChainService } from './linechain.service';

@Controller()
export class AppController {
  constructor(private readonly lineChainService: LineChainService) {}

  @Post()
  writeMessage(@Body() { message }: { message: string }) {
    try {
      return this.lineChainService.writeMessage(message);
    } catch (err) {
      return err.message;
    }
  }
}
