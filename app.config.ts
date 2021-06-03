import { PgConfig } from './src/controllers/data-controller/database/PgConfig';

export interface ApplicationConfig {
  PgConfig?: PgConfig;
}

export const CONFIG: ApplicationConfig = {
  PgConfig: {
    host: '134.122.16.140',
    port: 5432,
    login: 'zhenia',
    password: 'a84hg7dT!!a',
    database: 'postgres',
    schema: 'public',
    // host: '127.0.0.1',
    // port: 5432,
    // login: 'postgres',
    // password: 'admin',
    // database: 'postgres',
    // schema: 'public',
  },
};
