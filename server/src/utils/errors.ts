export class AppError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code: string = 'BAD_REQUEST') {
    super(code, message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super('ACCOUNT_NOT_FOUND', message, 404);
  }
}

export class InsufficientFundsError extends AppError {
  constructor(message: string) {
    super('INSUFFICIENT_FUNDS', message, 400);
  }
}
