import { HttpException, HttpStatus } from '@nestjs/common';

export class BookNotAvailableException extends HttpException {
  constructor(message = 'No available copies of this book') {
    super(message, HttpStatus.CONFLICT);
  }
}
