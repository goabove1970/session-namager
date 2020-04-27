import { DatabaseController } from '../DataController';
import { Value } from 'ts-postgres';
import { Session } from '@root/src/models/session';

export class SessionPostgresController extends DatabaseController<Session> {
  constructor() {
    super('session');
  }

  readSelectResponse(values: Value[][]): Session[] {
    const collection: Session[] = [];
    values.forEach((valueRow) => {
      collection.push({
        sessionId: valueRow[0],
        loginTimestamp: valueRow[1],
        sessionData: valueRow[2],
      } as Session);
    });

    return collection;
  }
}

export const sessionPostgresDataController: DatabaseController<Session> = new SessionPostgresController();
