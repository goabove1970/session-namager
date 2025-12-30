import { SessionArgs } from "@root/src/routes/session-request";
import { DatabaseError } from "@root/src/models/errors";
import { ErrorCode } from "@root/src/models/error-codes";

export async function matchesReadArgs(args: SessionArgs): Promise<string> {
  if (!args) {
    return "";
  }

  const conditions = [];
  if (args.sessionId) {
    conditions.push(`session_id = '${args.sessionId}'`);
  }

  let finalSattement =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return finalSattement;
}

export function validateSessionUpdateArgs(args: SessionArgs): void {
  if (!args) {
    throw new DatabaseError(
      "Can not update session, no arguments passed",
      ErrorCode.DATABASE_ERROR
    );
  }

  if (!args.sessionId) {
    throw new DatabaseError(
      "Can not update session, no sessionId passed",
      ErrorCode.MISSING_SESSION_ID
    );
  }
}

export function validateSessionCreateArgs(args: SessionArgs): void {
  if (!args) {
    throw new DatabaseError(
      "Can not create session, no arguments passed",
      ErrorCode.DATABASE_ERROR
    );
  }

  if (!args.sessionId) {
    throw new DatabaseError(
      "Can not create session, no sessionId passed",
      ErrorCode.DATABASE_ERROR
    );
  }

  if (!args.userId) {
    throw new DatabaseError(
      "Can not create session, no userId passed",
      ErrorCode.MISSING_USER_ID
    );
  }

  if (!args.loginTimestamp) {
    throw new DatabaseError(
      "Can not create session, no loginTimestamp",
      ErrorCode.DATABASE_ERROR
    );
  }
}
