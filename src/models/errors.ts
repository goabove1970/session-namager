import { ErrorCode } from './error-codes';

export class ErrorBase {
  constructor(errorMesage?: string, errorCode?: number) {
    this.errorMessage = errorMesage;
    this.errorCode = errorCode;
  }
  errorMessage?: string;
  errorCode?: number;
}

export class DatabaseError extends ErrorBase {
  constructor(errorMesage?: string, errorCode?: number) {
    super(
      errorMesage || 'could not process database request',
      errorCode || ErrorCode.DATABASE_ERROR
    );
  }
}

export class SessionError extends ErrorBase {
  constructor(errorMesage?: string, errorCode?: number) {
    super(
      errorMesage || 'could not process session request',
      errorCode || ErrorCode.INVALID_REQUEST
    );
  }
}


