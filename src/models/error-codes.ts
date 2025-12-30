/**
 * Error codes for Session Manager API
 * 
 * Error Code Ranges:
 * - 1000-1999: Request/Validation errors
 * - 2000-2999: Session operation errors
 * - 3000-3999: Database errors
 */
export enum ErrorCode {
  // Request/Validation Errors (1000-1999)
  INVALID_REQUEST = 1000,
  MISSING_REQUEST_BODY = 1001,
  MISSING_USER_ID = 1002,
  MISSING_SESSION_ID = 1003,
  INVALID_ACTION = 1004,

  // Session Operation Errors (2000-2999)
  SESSION_NOT_FOUND = 2000,
  SESSION_EXPIRED = 2001,
  SESSION_ALREADY_TERMINATED = 2002,
  
  // Extend Session Errors (2020-2029)
  EXTEND_SESSION_NOT_FOUND = 2020,
  EXTEND_SESSION_EXPIRED = 2021,
  
  // Validate Session Errors (2030-2039)
  VALIDATE_SESSION_ERROR = 2030,
  
  // Terminate Session Errors (2040-2049)
  TERMINATE_SESSION_ERROR = 2040,

  // Database Errors (3000-3999)
  DATABASE_ERROR = 3000,
  DATABASE_CONNECTION_ERROR = 3001,
  DATABASE_QUERY_ERROR = 3002,
}

