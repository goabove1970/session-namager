export enum SessionRequestType {
  Extend = 'extend',
  Terminate = 'terminate',
  Validate = 'validate',
  Init = 'init',
}

export type SessionState = 'ACTIVE' | 'EXPIRED';

export interface ResponseBase {
  error?: string;
  errorCode?: number;
  payload?: {
    sessionId?: string;
    message?: string;
    state?: SessionState;
    loginTimestamp?: Date;
    userId?: string;
  };
}

export interface SessionRequest {
  action?: SessionRequestType;
  args?: SessionArgs;
}

export interface SessionResponse extends ResponseBase {
  action?: SessionRequestType;
}

export interface SessionArgs {
  sessionId?: string;
  sessionData?: string;
  loginTimestamp?: Date;
  userId?: string;
}
