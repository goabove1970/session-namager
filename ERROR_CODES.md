# Error Codes Reference

This document describes all error codes used in the Session Manager API.

## Error Code Ranges

- **1000-1999**: Request/Validation errors
- **2000-2999**: Session operation errors
- **3000-3999**: Database errors

## Error Codes

### Request/Validation Errors (1000-1999)

| Code | Name | Description | When It Occurs |
|------|------|-------------|----------------|
| 1000 | INVALID_REQUEST | Invalid request format | General invalid request |
| 1001 | MISSING_REQUEST_BODY | Missing request body | When request body is empty or missing |
| 1002 | MISSING_USER_ID | Missing userId parameter | When creating session without userId |
| 1003 | MISSING_SESSION_ID | Missing sessionId parameter | When sessionId is required but not provided |
| 1004 | INVALID_ACTION | Invalid or missing action | When action is missing or invalid |

### Session Operation Errors (2000-2999)

| Code | Name | Description | When It Occurs |
|------|------|-------------|----------------|
| 2000 | SESSION_NOT_FOUND | Session not found | General session not found error |
| 2001 | SESSION_EXPIRED | Session expired | General session expired error |
| 2002 | SESSION_ALREADY_TERMINATED | Session already terminated | When trying to operate on terminated session |

#### Extend Session Errors (2020-2029)

| Code | Name | Description | When It Occurs |
|------|------|-------------|----------------|
| 2020 | EXTEND_SESSION_NOT_FOUND | Session not found for extend | When extending non-existent session |
| 2021 | EXTEND_SESSION_EXPIRED | Session expired for extend | When extending expired session |

#### Validate Session Errors (2030-2039)

| Code | Name | Description | When It Occurs |
|------|------|-------------|----------------|
| 2030 | VALIDATE_SESSION_ERROR | Validation error | When validation fails (currently unused) |

#### Terminate Session Errors (2040-2049)

| Code | Name | Description | When It Occurs |
|------|------|-------------|----------------|
| 2040 | TERMINATE_SESSION_ERROR | Termination error | When termination fails (currently unused) |

### Database Errors (3000-3999)

| Code | Name | Description | When It Occurs |
|------|------|-------------|----------------|
| 3000 | DATABASE_ERROR | General database error | When database operation fails |
| 3001 | DATABASE_CONNECTION_ERROR | Database connection error | When connection to database fails |
| 3002 | DATABASE_QUERY_ERROR | Database query error | When query execution fails |

## Error Response Format

All error responses follow this format:

```json
{
  "action": "init|extend|validate|terminate",
  "error": "Error message description",
  "errorCode": 1001,
  "payload": {
    // Optional payload data
  }
}
```

## Usage Examples

### Missing Request Body
```json
{
  "error": "Invalid request: missing request body",
  "errorCode": 1001
}
```

### Missing userId
```json
{
  "action": "init",
  "error": "Can not create session, no userId passed",
  "errorCode": 1002
}
```

### Session Not Found (Extend)
```json
{
  "action": "extend",
  "error": "Can not extend session ..., session was not found, please relogin",
  "errorCode": 2020,
  "payload": {
    "sessionId": "..."
  }
}
```

### Session Expired (Extend)
```json
{
  "action": "extend",
  "error": "Can not extend session ..., the session has expired",
  "errorCode": 2021,
  "payload": {
    "sessionId": "..."
  }
}
```

### Database Error
```json
{
  "action": "init",
  "error": "Database error: connection failed",
  "errorCode": 3000
}
```

## Implementation

Error codes are defined in `src/models/error-codes.ts` and used throughout the application:

- `src/routes/sessions.ts` - Route handlers
- `src/models/errors.ts` - Error classes
- `src/controllers/data-controller/session/helper.ts` - Validation helpers

## Notes

- All error responses return HTTP 200 status (errors are in the response body)
- Error codes are numeric for easy programmatic handling
- Error messages are human-readable for debugging
- Some operations (like terminate on non-existent session) don't return error codes as they're not considered errors


