import {
  SessionResponse,
  SessionRequest,
  SessionRequestType,
  SessionArgs,
} from './session-request';
import { Router } from 'express';
import { ErrorCode } from '@root/src/models/error-codes';
import * as moment from 'moment';
import { sessionController } from '../controllers/session-controller';
import { GuidFull } from '../utils/generateGuid';
import logger from '../logger';
import { Session } from '../models/session';
import { inspect } from 'util';

const router = Router();

const logoutAfterMinutes = 15;

const process = async function(req, res, next) {
  const sessionRequest = req.body as SessionRequest;
  if (!sessionRequest || Object.keys(sessionRequest).length === 0) {
    const response: SessionResponse = {
      error: 'Invalid request: missing request body',
      errorCode: ErrorCode.MISSING_REQUEST_BODY,
    };
    return res.status(200).json(response);
  }

  if (!sessionRequest.action) {
    const response: SessionResponse = {
      error: 'Invalid request: missing action',
      errorCode: ErrorCode.INVALID_ACTION,
    };
    return res.status(200).json(response);
  }

  let responseData: SessionResponse = {};

  switch (sessionRequest.action) {
    case SessionRequestType.Init:
      responseData = await processInitSessionRequest(sessionRequest.args);
      break;
    case SessionRequestType.Extend:
      responseData = await processExtendSessionRequest(sessionRequest.args);
      break;
    case SessionRequestType.Validate:
      responseData = await processValidateSessionRequest(sessionRequest.args);
      break;
    case SessionRequestType.Terminate:
      responseData = await processTerminateSessionRequest(sessionRequest.args);
      break;
    default:
      responseData = {
        action: sessionRequest.action,
        error: `Invalid action: ${sessionRequest.action}`,
        errorCode: ErrorCode.INVALID_ACTION,
      };
  }

  res.send(responseData);
};

router.post('/', process);
router.get('/', process);

const expired = (sess?: Session): boolean => {
  if (!sess || !sess.loginTimestamp) {
    return true;
  }
  if (!moment(sess.loginTimestamp).isValid()) {
    return true;
  }

  if (
    moment(sess.loginTimestamp).isBefore(moment()) &&
    moment(sess.loginTimestamp).isAfter(
      moment().subtract(logoutAfterMinutes, 'minute')
    )
  ) {
    return false;
  }

  return true;
};

async function processInitSessionRequest(
  args: SessionArgs
): Promise<SessionResponse> {
  const response: SessionResponse = {
    action: SessionRequestType.Init,
    payload: {},
  };

  // Validate required fields
  if (!args || !args.userId) {
    response.error = 'Can not create session, no userId passed';
    response.errorCode = ErrorCode.MISSING_USER_ID;
    return response;
  }

  const newSession: SessionArgs = {
    sessionId: GuidFull(),
    loginTimestamp: moment().toDate(),
    sessionData: args.sessionData,
    userId: args.userId,
  };

  try {
    await sessionController.create(newSession);
    response.payload = {
      ...response.payload,
      sessionId: newSession.sessionId,
      loginTimestamp: newSession.loginTimestamp,
      userId: newSession.userId,
    };
  } catch (error) {
    console.error(inspect(error));
    const errorMessage = error instanceof Error ? error.message : inspect(error);
    response.error = `Database error: ${errorMessage}`;
    response.errorCode = ErrorCode.DATABASE_ERROR;
  }
  return response;
}

async function processExtendSessionRequest(
  args: SessionArgs
): Promise<SessionResponse> {
  const response: SessionResponse = {
    action: SessionRequestType.Extend,
    payload: {
      sessionId: args.sessionId,
    },
  };

  // Validate required fields
  if (!args || !args.sessionId) {
    response.error = 'Can not extend session, no sessionId passed';
    response.errorCode = ErrorCode.MISSING_SESSION_ID;
    return response;
  }

  const newSession: SessionArgs = {
    sessionId: args.sessionId,
    loginTimestamp: moment().toDate(),
  };

  try {
    const sessions = await sessionController.read({
      sessionId: args.sessionId,
    });
    if (!sessions || !sessions.length || sessions.length !== 1) {
      const error = `Can not extend session ${args.sessionId}, session was not found, please relogin`;
      logger.error(error);
      response.error = error;
      response.errorCode = ErrorCode.EXTEND_SESSION_NOT_FOUND;
      return response;
    }
    const session = sessions[0];
    if (expired(session)) {
      const error = `Can not extend session ${args.sessionId}, the session has expired`;
      logger.error(error);
      response.error = error;
      response.errorCode = ErrorCode.EXTEND_SESSION_EXPIRED;
      return response;
    }

    await sessionController.update(newSession);
    response.payload = {
      ...response.payload,
      loginTimestamp: newSession.loginTimestamp,
      userId: session.userId,
    };
  } catch (error) {
    console.error(inspect(error));
    const errorMessage = error instanceof Error ? error.message : inspect(error);
    response.error = `Database error: ${errorMessage}`;
    response.errorCode = ErrorCode.DATABASE_ERROR;
  }
  return response;
}

async function processValidateSessionRequest(
  args: SessionArgs
): Promise<SessionResponse> {
  const response: SessionResponse = {
    action: SessionRequestType.Validate,
    payload: {
      sessionId: args.sessionId,
    },
  };

  // Validate required fields
  if (!args || !args.sessionId) {
    response.error = 'Can not validate session, no sessionId passed';
    response.errorCode = ErrorCode.MISSING_SESSION_ID;
    return response;
  }

  try {
    const sessions = await sessionController.read({
      sessionId: args.sessionId,
    });
    if (!sessions || !sessions.length || sessions.length !== 1) {
      response.payload = {
        ...response.payload,
        state: 'EXPIRED',
      };
      return response;
    }
    const session = sessions[0];

    response.payload = {
      ...response.payload,
      state: expired(session) ? 'EXPIRED' : 'ACTIVE',
    };
  } catch (error) {
    console.error(inspect(error));
    const errorMessage = error instanceof Error ? error.message : inspect(error);
    response.error = `Database error: ${errorMessage}`;
    response.errorCode = ErrorCode.DATABASE_ERROR;
  }
  return response;
}

async function processTerminateSessionRequest(
  args: SessionArgs
): Promise<SessionResponse> {
  const response: SessionResponse = {
    action: SessionRequestType.Terminate,
    payload: {
      sessionId: args.sessionId,
    },
  };

  // Validate required fields
  if (!args || !args.sessionId) {
    response.error = 'Can not terminate session, no sessionId passed';
    response.errorCode = ErrorCode.MISSING_SESSION_ID;
    return response;
  }

  try {
    const sessions = await sessionController.read({
      sessionId: args.sessionId,
    });
    if (!sessions || !sessions.length || sessions.length !== 1) {
      const error = `Can not terminate session ${args.sessionId}, session was not found.`;
      logger.error(error);
      response.payload = {
        message:
          'Session was not found, nothing to terminate. This is not considered to be an error.',
      };
      // Note: This is not an error case, so no errorCode
      return response;
    }
    const session = sessions[0];

    if (expired(session)) {
      const error = `Can not terminate session ${args.sessionId}, session has already expired.`;
      logger.info(error);
      response.payload = {
        message:
          'Session has expired prior to termination request. This is not considered to be an error.',
      };
      await sessionController.delete({ sessionId: args.sessionId });
      // Note: This is not an error case, so no errorCode
      return response;
    }

    await sessionController.delete({ sessionId: args.sessionId });
  } catch (error) {
    console.error(inspect(error));
    const errorMessage = error instanceof Error ? error.message : inspect(error);
    response.error = `Database error: ${errorMessage}`;
    response.errorCode = ErrorCode.DATABASE_ERROR;
  }
  return response;
}

export = router;
