import { Body, Controller, Post } from '@nestjs/common';

import { LineChainService } from './linechain.service';

@Controller()
export class AppController {
  constructor(private readonly lineChainService: LineChainService) {}

  @Post()
  queueItem(@Body() { message }: { message: string }) {
    return this.lineChainService.writeMessage(message);
  }
}
