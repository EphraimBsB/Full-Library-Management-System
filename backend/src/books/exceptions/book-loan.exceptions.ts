import { HttpException, HttpStatus } from '@nestjs/common';

export class LoanLimitExceededException extends HttpException {
  constructor(maxLoans: number) {
    super(`You have reached the maximum limit of ${maxLoans} active loans`, HttpStatus.FORBIDDEN);
  }
}

export class RenewalLimitExceededException extends HttpException {
  constructor(maxRenewals: number) {
    super(`Maximum number of renewals (${maxRenewals}) reached`, HttpStatus.FORBIDDEN);
  }
}

export class RenewalCooldownException extends HttpException {
  constructor(hoursRemaining: number) {
    super(`Please wait ${hoursRemaining} more hours before renewing again`, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class BookCopyNotAvailableException extends HttpException {
  constructor() {
    super('The requested book copy is not available', HttpStatus.CONFLICT);
  }
}
