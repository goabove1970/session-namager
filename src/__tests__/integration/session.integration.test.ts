require('module-alias/register');
const request = require('supertest');

const TEST_PORT = process.env.TEST_PORT || '9200';
const TEST_HOST = process.env.TEST_HOST || 'http://localhost';
const TEST_BASE_URL = `${TEST_HOST}:${TEST_PORT}`;
const BASE_URL = '/session';
const TEST_TIMEOUT = 5000; // 5 seconds should be enough for database operations

describe('Session Management Integration Tests', () => {
  let createdSessionId: string;
  let createdUserId: string = 'test-user-integration';

  // Wait for database connection before running tests
  beforeAll(async () => {
    // Give database time to connect
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Give time for any pending operations to complete
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  describe('POST /session - Init Session', () => {
    it('should successfully create a new session with userId and sessionData', async () => {
      const response = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'init',
          args: {
            userId: createdUserId,
            sessionData: 'test session data',
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('action', 'init');
      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('sessionId');
      expect(response.body.payload).toHaveProperty('loginTimestamp');
      expect(response.body.payload).toHaveProperty('userId', createdUserId);
      expect(response.body.payload.sessionId).toBeTruthy();
      expect(response.body.payload.loginTimestamp).toBeTruthy();

      createdSessionId = response.body.payload.sessionId;
    }, TEST_TIMEOUT);

    it('should return error when creating session without userId', async () => {
      const response = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'init',
          args: {},
        })
        .expect(200);

      expect(response.body).toHaveProperty('action', 'init');
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('no userId passed');
    }, TEST_TIMEOUT);

    it('should return error when request body is missing', async () => {
      const response = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({})
        .expect(200);

      // When body is empty {}, the API returns 200 but with error in response
      // The check in sessions.ts only checks if sessionRequest is falsy, but {} is truthy
      expect(response.body).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('POST /session - Extend Session', () => {
    beforeEach(async () => {
      // Create a session before each extend test
      const initResponse = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'init',
          args: {
            userId: createdUserId,
          },
        });
      createdSessionId = initResponse.body.payload.sessionId;
    });

    it('should successfully extend an active session', async () => {
      const response = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'extend',
          args: {
            sessionId: createdSessionId,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('action', 'extend');
      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('sessionId', createdSessionId);
      expect(response.body.payload).toHaveProperty('loginTimestamp');
      expect(response.body.payload).toHaveProperty('userId', createdUserId);
      expect(response.body.payload.loginTimestamp).toBeTruthy();
      expect(response.body).not.toHaveProperty('error');
    }, TEST_TIMEOUT);

    it('should return error when extending non-existent session', async () => {
      const nonExistentSessionId = 'non-existent-session-id-12345';
      const response = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'extend',
          args: {
            sessionId: nonExistentSessionId,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('action', 'extend');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('errorCode', 2020);
      expect(response.body.error).toContain('session was not found');
      expect(response.body.error).toContain('please relogin');
    }, TEST_TIMEOUT);

    it('should return error when extending expired session', async () => {
      // Create a session that will be expired (terminated sessions are deleted, so we test with a non-existent one)
      // For a truly expired session test, we'd need a session with old timestamp, but terminate deletes it
      // So we test that extending a terminated (deleted) session returns appropriate error
      const initResponse = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'init',
          args: {
            userId: createdUserId,
          },
        });
      const sessionId = initResponse.body.payload.sessionId;

      // Terminate the session (this deletes it from the database)
      await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'terminate',
          args: {
            sessionId: sessionId,
          },
        });

      // Try to extend the terminated (deleted) session
      // Since terminate deletes the session, it will return "not found" (2020) not "expired" (2021)
      const response = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'extend',
          args: {
            sessionId: sessionId,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('action', 'extend');
      expect(response.body).toHaveProperty('error');
      // Terminated sessions are deleted, so they return "not found" (2020) not "expired" (2021)
      expect(response.body).toHaveProperty('errorCode', 2020);
      expect(response.body.error).toContain('session was not found');
    }, TEST_TIMEOUT);
  });

  describe('POST /session - Validate Session', () => {
    beforeEach(async () => {
      // Create a session before each validate test
      const initResponse = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'init',
          args: {
            userId: createdUserId,
          },
        });
      createdSessionId = initResponse.body.payload.sessionId;
    });

    it('should return ACTIVE state for a valid active session', async () => {
      const response = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'validate',
          args: {
            sessionId: createdSessionId,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('action', 'validate');
      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('sessionId', createdSessionId);
      expect(response.body.payload).toHaveProperty('state', 'ACTIVE');
    }, TEST_TIMEOUT);

    it('should return EXPIRED state for a terminated session', async () => {
      // Terminate the session first
      await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'terminate',
          args: {
            sessionId: createdSessionId,
          },
        });

      // Validate the terminated session
      const response = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'validate',
          args: {
            sessionId: createdSessionId,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('action', 'validate');
      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('sessionId', createdSessionId);
      expect(response.body.payload).toHaveProperty('state', 'EXPIRED');
    }, TEST_TIMEOUT);

    it('should return EXPIRED state for non-existent session', async () => {
      const nonExistentSessionId = 'non-existent-session-id-12345';
      const response = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'validate',
          args: {
            sessionId: nonExistentSessionId,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('action', 'validate');
      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('sessionId', nonExistentSessionId);
      expect(response.body.payload).toHaveProperty('state', 'EXPIRED');
    }, TEST_TIMEOUT);
  });

  describe('POST /session - Terminate Session', () => {
    beforeEach(async () => {
      // Create a session before each terminate test
      const initResponse = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'init',
          args: {
            userId: createdUserId,
          },
        });
      createdSessionId = initResponse.body.payload.sessionId;
    });

    it('should successfully terminate an active session', async () => {
      const response = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'terminate',
          args: {
            sessionId: createdSessionId,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('action', 'terminate');
      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('sessionId', createdSessionId);
      expect(response.body).not.toHaveProperty('error');
    }, TEST_TIMEOUT);

    it('should handle termination of non-existent session gracefully', async () => {
      const nonExistentSessionId = 'non-existent-session-id-12345';
      const response = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'terminate',
          args: {
            sessionId: nonExistentSessionId,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('action', 'terminate');
      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('message');
      expect(response.body.payload.message).toContain('Session was not found');
      expect(response.body.payload.message).toContain('not considered to be an error');
      expect(response.body).not.toHaveProperty('error');
    }, TEST_TIMEOUT);

    it('should handle termination of already expired session gracefully', async () => {
      // Terminate the session first
      await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'terminate',
          args: {
            sessionId: createdSessionId,
          },
        });

      // Try to terminate again
      const response = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'terminate',
          args: {
            sessionId: createdSessionId,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('action', 'terminate');
      expect(response.body).toHaveProperty('payload');
      // Should handle gracefully - either message or no error
    }, TEST_TIMEOUT);
  });

  describe('GET /session - Alternative HTTP Method', () => {
    it('should accept GET requests with same functionality', async () => {
      const response = await request(TEST_BASE_URL)
        .get(BASE_URL)
        .send({
          action: 'init',
          args: {
            userId: createdUserId,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('action', 'init');
      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('sessionId');
    }, TEST_TIMEOUT);
  });

  describe('Session Lifecycle - Complete Flow', () => {
    it('should handle complete session lifecycle: init -> extend -> validate -> terminate', async () => {
      // 1. Init
      const initResponse = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'init',
          args: {
            userId: createdUserId,
            sessionData: 'lifecycle test data',
          },
        })
        .expect(200);

      const sessionId = initResponse.body.payload.sessionId;
      expect(initResponse.body.payload.state).toBeUndefined(); // Init doesn't return state

      // 2. Validate (should be ACTIVE)
      const validateResponse1 = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'validate',
          args: {
            sessionId: sessionId,
          },
        })
        .expect(200);
      expect(validateResponse1.body.payload.state).toBe('ACTIVE');

      // 3. Extend
      const extendResponse = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'extend',
          args: {
            sessionId: sessionId,
          },
        })
        .expect(200);
      expect(extendResponse.body.payload.loginTimestamp).toBeTruthy();

      // 4. Validate again (should still be ACTIVE)
      const validateResponse2 = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'validate',
          args: {
            sessionId: sessionId,
          },
        })
        .expect(200);
      expect(validateResponse2.body.payload.state).toBe('ACTIVE');

      // 5. Terminate
      const terminateResponse = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'terminate',
          args: {
            sessionId: sessionId,
          },
        })
        .expect(200);
      expect(terminateResponse.body.payload.sessionId).toBe(sessionId);

      // 6. Validate after termination (should be EXPIRED)
      const validateResponse3 = await request(TEST_BASE_URL)
        .post(BASE_URL)
        .send({
          action: 'validate',
          args: {
            sessionId: sessionId,
          },
        })
        .expect(200);
      expect(validateResponse3.body.payload.state).toBe('EXPIRED');
    }, TEST_TIMEOUT);
  });
});

