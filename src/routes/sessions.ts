import { SessionResponse, SessionRequest, SessionRequestType, SessionArgs } from './session-request';
import { Router } from 'express';
import { SessionError } from '@root/src/models/errors';
import * as moment from 'moment';
import { sessionController } from '../controllers/session-controller';
import { GuidFull } from '../utils/generateGuid';
import logger from '../logger';
import { Session } from '../models/session';

const router = Router();

const process = async function(req, res, next) {
  const sessionRequest = req.body as SessionRequest;
  if (!sessionRequest) {
    return res.status(500).send(new SessionError());
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
    moment(sess.loginTimestamp).isAfter(moment().subtract(15, 'minute'))
  ) {
    return true;
  }

  return false;
};

async function processInitSessionRequest(args: SessionArgs): Promise<SessionResponse> {
  const response: SessionResponse = { action: SessionRequestType.Init, payload: {} };

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
    console.error(error.message || error);
    response.error = error.message || error;
  }
  return response;
}

async function processExtendSessionRequest(args: SessionArgs): Promise<SessionResponse> {
  const response: SessionResponse = {
    action: SessionRequestType.Extend,
    payload: {
      sessionId: args.sessionId,
    },
  };

  const newSession: SessionArgs = {
    sessionId: args.sessionId,
    loginTimestamp: moment().toDate(),
  };

  try {
    const sessions = await sessionController.read({ sessionId: args.sessionId });
    if (!sessions || !sessions.length || sessions.length !== 1) {
      const error = `Can not extend session ${args.sessionId}, session was not found, please relogin`;
      logger.error(error);
      response.error = error;
      response.errorCode = 2020;
      return response;
    }
    const session = sessions[0];
    if (expired(session)) {
      const error = `Can not extend session ${args.sessionId}, the session has expired`;
      logger.error(error);
      response.error = error;
      response.errorCode = 2021;
      return response;
    }

    await sessionController.update(newSession);
    response.payload = {
      ...response.payload,
      loginTimestamp: newSession.loginTimestamp,
      userId: session.userId,
    };
  } catch (error) {
    console.error(error.message || error);
    response.error = error.message || error;
  }
  return response;
}

async function processValidateSessionRequest(args: SessionArgs): Promise<SessionResponse> {
  const response: SessionResponse = {
    action: SessionRequestType.Validate,
    payload: {
      sessionId: args.sessionId,
    },
  };

  try {
    const sessions = await sessionController.read({ sessionId: args.sessionId });
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
    console.error(error.message || error);
    response.error = error.message || error;
  }
  return response;
}

async function processTerminateSessionRequest(args: SessionArgs): Promise<SessionResponse> {
  const response: SessionResponse = {
    action: SessionRequestType.Terminate,
    payload: {
      sessionId: args.sessionId,
    },
  };

  try {
    const sessions = await sessionController.read({ sessionId: args.sessionId });
    if (!sessions || !sessions.length || sessions.length !== 1) {
      const error = `Can not terminate session ${args.sessionId}, session was not found.`;
      logger.error(error);
      response.payload = {
        message: 'Session was not found, nothing to terminate. This is not considered to be an error.',
      };
      return response;
    }
    const session = sessions[0];

    if (expired(session)) {
      const error = `Can not terminate session ${args.sessionId}, session has alread expired.`;
      logger.info(error);
      response.payload = {
        message: 'Session has expired prior to termination request. This is not considered to be an error.',
      };
      await sessionController.delete({ sessionId: args.sessionId });
      return response;
    }

    await sessionController.delete({ sessionId: args.sessionId });
  } catch (error) {
    console.error(error.message || error);
    response.error = error.message || error;
  }
  return response;
}

export = router;
