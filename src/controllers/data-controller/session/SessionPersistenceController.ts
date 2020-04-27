import { SessionPersistanceControllerBase } from './SessionPersistanceControllerBase';
import { DatabaseController } from '../DataController';
import { sessionPostgresDataController } from './SessionPostgresController';
import moment = require('moment');
import { Session } from '@root/src/models/session';
import { SessionArgs } from '@root/src/routes/session-request';
import { validateSessionUpdateArgs, validateSessionCreateArgs, matchesReadArgs } from './helper';
import { DatabaseError } from '@root/src/models/errors';

export class SessionPersistenceController implements SessionPersistanceControllerBase {
  private dataController: DatabaseController<Session>;

  constructor(controller: DatabaseController<Session>) {
    this.dataController = controller;
  }

  async update(args: SessionArgs): Promise<void> {
    const session = await this.read(args);

    if (!session) {
      throw new DatabaseError('session not found');
    }

    validateSessionUpdateArgs(args);

    const updateFields: string[] = [];

    if (args.sessionData) {
      updateFields.push(`session_data='${args.sessionData}'`);
    }

    if (args.loginTimestamp) {
      updateFields.push(`login_timestamp='${moment(args.loginTimestamp).toISOString()}'`);
    }

    const updateStatement = updateFields.join(',\n');

    this.dataController.update(`
                SET
                    ${updateStatement}
                WHERE 
                    session_id='${args.sessionId}';`);
  }

  async add(args: SessionArgs): Promise<void> {
    validateSessionCreateArgs(args);

    this.dataController.insert(`
        (
            session_id,
            session_data,
            login_timestamp)
            VALUES (
                '${args.sessionId}',
                ${args.sessionData ? "'" + args.sessionData + "'" : 'NULL'},
                '${moment(args.loginTimestamp).toISOString()}');`);
  }

  async delete(args: SessionArgs): Promise<void> {
    const expression = await matchesReadArgs(args);
    this.dataController.delete(expression).catch((error) => {
      throw error;
    });
  }

  async read(args: SessionArgs): Promise<Session[]> {
    const expression = await matchesReadArgs(args);

    return this.dataController.select(expression).catch((error) => {
      throw error;
    });
  }
}

export const sessionDatabaseController = new SessionPersistenceController(sessionPostgresDataController);
