import { Client, Configuration, Result } from 'ts-postgres';
import { PgConfig } from './PgConfig';
import { getConfig } from '@root/app.config';
import logger from '@root/src/logger';

export class PgPool {
  private client: Client;
  private _config: PgConfig;
  private connectionPromise: Promise<void>;

  get connected(): boolean {
    return !this.client.closed;
  }

  get config(): PgConfig {
    return this._config;
  }

  constructor(config: PgConfig) {
    this._config = config;
    const clientConfiguration: Configuration = {
      database: this._config.database,
      host: this._config.host,
      port: this._config.port,
      user: this._config.login,
      password: this._config.password,
      keepAlive: true,
    };
    this.client = new Client(clientConfiguration);
    this.connectionPromise = this.client
      .connect()
      .then(() => {
        this.client.on('error', console.error);
        if (!this.client.closed) {
          logger.info(`Conneted to the database: ${this.client.config.database}:${this.client.config.port}`);
        }
      })
      .catch((error) => {
        logger.error(`Failed to connect to database: ${error.message}`);
        throw error;
      });
  }

  async query(query?: string): Promise<Result> {
    // Ensure connection is ready before executing query
    await this.connectionPromise;
    
    // Check if connection is closed and reconnect if needed
    if (this.client.closed) {
      logger.warn('Database connection closed, reconnecting...');
      this.connectionPromise = this.client
        .connect()
        .then(() => {
          this.client.on('error', console.error);
          if (!this.client.closed) {
            logger.info(`Reconnected to the database: ${this.client.config.database}:${this.client.config.port}`);
          }
        })
        .catch((error) => {
          logger.error(`Failed to reconnect to database: ${error.message}`);
          throw error;
        });
      await this.connectionPromise;
    }
    
    logger.debug(`Running database query: [${query}]`);
    return this.client
      .query(query)
      .then((r) => {
        logger.debug(`Got database result [${JSON.stringify(r, null, 4)}]`);
        return r;
      })
      .catch((error) => {
        logger.error(`Query failed: ${error.message}`);
        throw error;
      });
  }
}

const pool = new PgPool(getConfig().PgConfig);
export default pool;
