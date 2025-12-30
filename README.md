# Session Manager API

A Node.js/Express session management service with PostgreSQL backend. Provides RESTful API endpoints for session initialization, extension, validation, and termination.

## Features

- ✅ Session lifecycle management (init, extend, validate, terminate)
- ✅ PostgreSQL database persistence
- ✅ Automatic connection reconnection
- ✅ Comprehensive integration tests
- ✅ TypeScript support
- ✅ RESTful API design

## Prerequisites

- Node.js (v12+)
- npm
- PostgreSQL (v12+)
- TypeScript (installed via npm)

## Setup from Scratch

### 1. Clone the Repository

```bash
git clone https://github.com/goabove1970/session-namager.git
cd session-namager
```

### 2. Install PostgreSQL

#### macOS (Homebrew)

```bash
brew install postgresql@15
brew services start postgresql@15
```

#### macOS (Postgres.app)

1. Download from https://postgresapp.com/
2. Install and initialize a new server
3. Add PostgreSQL to your PATH

#### Linux

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows

Download and install from https://www.postgresql.org/download/windows/

### 3. Setup Database

Run the setup script:

```bash
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

Or manually:

```bash
# Connect to PostgreSQL
psql -U postgres -d postgres

# Create the session table
\i database/session.sql

# Or run directly:
psql -U postgres -d postgres -f database/session.sql
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Configure Database Connection

Edit `app.config.ts` to match your PostgreSQL settings:

```typescript
const LOCAL_CONFIG: ApplicationConfig = {
  PgConfig: {
    host: "127.0.0.1", // Database host
    port: 5432, // Database port
    login: "postgres", // Database user
    password: "admin", // Database password
    database: "postgres", // Database name
    schema: "public", // Schema name
  },
};
```

The application uses `LOCAL_CONFIG` when `NODE_ENV=development`.

## Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

Or use the TypeScript compiler directly:

```bash
npm run compile
# or
npm run build:ts
```

The compiled JavaScript files will be in the `dist/` directory.

## Run

### Development Mode

```bash
npm run start-local
```

This sets `NODE_ENV=development` and starts the server on port **9200**.

### Production Mode

```bash
npm start
```

The server will start on the port specified in `process.env.PORT` or default to **9200**.

### Verify Server is Running

```bash
curl http://localhost:9200/session \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"action":"init","args":{"userId":"test"}}'
```

## API Endpoints

All endpoints accept `POST` and `GET` requests to `/session`.

### Request Format

```json
{
  "action": "init|extend|validate|terminate",
  "args": {
    // action-specific arguments
  }
}
```

### Response Format

```json
{
  "action": "init|extend|validate|terminate",
  "payload": {
    // response data
  },
  "error": "error message (if any)",
  "errorCode": 2020|2021 (if error)
}
```

## Request Samples

### 1. Initialize Session

Create a new session for a user.

**Request:**

```bash
curl -X POST http://localhost:9200/session \
  -H "Content-Type: application/json" \
  -d '{
    "action": "init",
    "args": {
      "userId": "user123",
      "sessionData": "optional session data"
    }
  }'
```

**Response:**

```json
{
  "action": "init",
  "payload": {
    "sessionId": "079ec892-af3e-9ddd-30c2-3a1e7f1a9299",
    "loginTimestamp": "2025-12-29T22:29:04.219Z",
    "userId": "user123"
  }
}
```

**Required Fields:**

- `args.userId` (string, required)

**Optional Fields:**

- `args.sessionData` (string, optional)

### 2. Extend Session

Extend the lifetime of an existing active session.

**Request:**

```bash
curl -X POST http://localhost:9200/session \
  -H "Content-Type: application/json" \
  -d '{
    "action": "extend",
    "args": {
      "sessionId": "079ec892-af3e-9ddd-30c2-3a1e7f1a9299"
    }
  }'
```

**Response:**

```json
{
  "action": "extend",
  "payload": {
    "sessionId": "079ec892-af3e-9ddd-30c2-3a1e7f1a9299",
    "loginTimestamp": "2025-12-29T22:30:15.123Z",
    "userId": "user123"
  }
}
```

**Error Response (session not found):**

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

**Error Response (session expired):**

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

**Required Fields:**

- `args.sessionId` (string, required)

### 3. Validate Session

Check if a session is active or expired.

**Request:**

```bash
curl -X POST http://localhost:9200/session \
  -H "Content-Type: application/json" \
  -d '{
    "action": "validate",
    "args": {
      "sessionId": "079ec892-af3e-9ddd-30c2-3a1e7f1a9299"
    }
  }'
```

**Response (Active):**

```json
{
  "action": "validate",
  "payload": {
    "sessionId": "079ec892-af3e-9ddd-30c2-3a1e7f1a9299",
    "state": "ACTIVE"
  }
}
```

**Response (Expired):**

```json
{
  "action": "validate",
  "payload": {
    "sessionId": "079ec892-af3e-9ddd-30c2-3a1e7f1a9299",
    "state": "EXPIRED"
  }
}
```

**Required Fields:**

- `args.sessionId` (string, required)

### 4. Terminate Session

End a session (deletes it from the database).

**Request:**

```bash
curl -X POST http://localhost:9200/session \
  -H "Content-Type: application/json" \
  -d '{
    "action": "terminate",
    "args": {
      "sessionId": "079ec892-af3e-9ddd-30c2-3a1e7f1a9299"
    }
  }'
```

**Response:**

```json
{
  "action": "terminate",
  "payload": {
    "sessionId": "079ec892-af3e-9ddd-30c2-3a1e7f1a9299"
  }
}
```

**Response (session not found - not an error):**

```json
{
  "action": "terminate",
  "payload": {
    "sessionId": "...",
    "message": "Session was not found, nothing to terminate. This is not considered to be an error."
  }
}
```

**Required Fields:**

- `args.sessionId` (string, required)

## Running Tests

### Integration Tests

Run all integration tests:

```bash
npm run test:integration
```

**Test Suite Overview:**

The integration test suite includes **14 tests** covering:

1. **Init Session Tests (3 tests)**
   - ✅ Create session with userId and sessionData
   - ✅ Error when creating without userId
   - ✅ Error handling for missing request body

2. **Extend Session Tests (3 tests)**
   - ✅ Successfully extend an active session
   - ✅ Error when extending non-existent session
   - ✅ Error when extending expired/terminated session

3. **Validate Session Tests (3 tests)**
   - ✅ Return ACTIVE state for valid active session
   - ✅ Return EXPIRED state for terminated session
   - ✅ Return EXPIRED state for non-existent session

4. **Terminate Session Tests (3 tests)**
   - ✅ Successfully terminate an active session
   - ✅ Graceful handling of non-existent session
   - ✅ Graceful handling of already expired session

5. **Alternative HTTP Method (1 test)**
   - ✅ Accept GET requests with same functionality

6. **Complete Lifecycle Test (1 test)**
   - ✅ Full session lifecycle: init → extend → validate → terminate

**Test Configuration:**

- Tests target the running server on `http://localhost:9200`
- Default timeout: 5 seconds per test
- Database connection is established before tests run

**Expected Results:**

- All 14 tests should pass
- Total execution time: ~3-4 seconds

### All Tests

Run all tests (unit + integration):

```bash
npm test
```

### Watch Mode

Run tests in watch mode (re-runs on file changes):

```bash
npm run test:watch
```

### Coverage

Generate test coverage report:

```bash
npm run test:coverage
```

## Project Structure

```
session-namager/
├── src/                          # TypeScript source files
│   ├── __tests__/                # Test files
│   │   └── integration/          # Integration tests
│   ├── controllers/              # Business logic controllers
│   │   ├── data-controller/      # Database controllers
│   │   └── session-controller/   # Session management
│   ├── models/                   # Data models
│   ├── routes/                    # Express routes
│   └── utils/                    # Utility functions
├── dist/                          # Compiled JavaScript (generated)
├── database/                      # Database schema files
├── request-examples/              # API request examples
├── scripts/                       # Setup and utility scripts
├── app.ts                         # Express app configuration
├── app.config.ts                  # Application configuration
└── package.json                   # Dependencies and scripts
```

## Configuration

### Environment Variables

- `NODE_ENV`: Set to `development` to use local database config
- `PORT`: Server port (default: 9200)

### Database Configuration

Edit `app.config.ts` to configure database connection:

```typescript
const LOCAL_CONFIG: ApplicationConfig = {
  PgConfig: {
    host: "127.0.0.1",
    port: 5432,
    login: "postgres",
    password: "admin",
    database: "postgres",
    schema: "public",
  },
};
```

## Session Expiration

Sessions expire after **15 minutes** of inactivity. The expiration is checked based on the `loginTimestamp` field.

## Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL is running:**

   ```bash
   pg_isready
   # or
   brew services list  # macOS
   ```

2. **Verify connection settings** in `app.config.ts`

3. **Check database exists:**

   ```bash
   psql -U postgres -d postgres -c "\l"
   ```

4. **Verify table exists:**
   ```bash
   psql -U postgres -d postgres -c "\d session"
   ```

### Port Already in Use

If port 9200 is already in use:

```bash
# Find process using port 9200
lsof -i :9200

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=9201 npm start
```

### Tests Failing

1. **Ensure server is running** on port 9200
2. **Check database connection** is working
3. **Verify test timeout** is sufficient (default: 5 seconds)

## License

Private project

## Version

3.2.0


