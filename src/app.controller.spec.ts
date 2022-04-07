import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';
import { LineChainService } from './linechain.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [LineChainService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('writeMessage "Hola Mundo"', () => {
    it('should return true', () => {
      expect(appController.writeMessage({ message: 'Hola Mundo' })).toBe(true);
    });
  });

  describe('writeMessage with empty message', () => {
    it('should throw an exception', () => {
      try {
        appController.writeMessage({ message: undefined });
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
      }
    });
  });
});
