import { SessionArgs } from '@root/src/routes/session-request';
import { DatabaseError } from '@root/src/models/errors';

export async function matchesReadArgs(args: SessionArgs): Promise<string> {
  if (!args) {
    return '';
  }

  const conditions = [];
  if (args.sessionId) {
    conditions.push(`session_id = '${args.sessionId}'`);
  }

  let finalSattement = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return finalSattement;
}

export function validateSessionUpdateArgs(args: SessionArgs): void {
  if (!args) {
    throw new DatabaseError('Can not update session, no arguments passed');
  }

  if (!args.sessionId) {
    throw new DatabaseError('Can not update session, no sessionId passed');
  }
}

export function validateSessionCreateArgs(args: SessionArgs): void {
  if (!args) {
    throw new DatabaseError('Can not create session, no arguments passed');
  }

  if (!args.sessionId) {
    throw new DatabaseError('Can not create session, no sessionId passed');
  }

  if (!args.userId) {
    throw new DatabaseError('Can not create session, no userId passed');
  }

  if (!args.loginTimestamp) {
    throw new DatabaseError('Can not create session, no loginTimestamp');
  }
}
